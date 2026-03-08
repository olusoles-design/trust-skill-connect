import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Upload, FileText, Loader2, CheckCircle2, AlertCircle,
  Award, Building2, Hash, Calendar, BookOpen, ChevronRight,
  Edit3, Save, Trash2, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ExtractedData {
  practitioner_name: string;
  id_number: string;
  registration_number: string;
  seta_body: string;
  role_type: string;
  valid_from: string | null;
  valid_to: string | null;
  qualifications: Array<{
    saqa_id: string;
    title: string;
    nqf_level: string;
    credits: number;
  }>;
  raw_notes?: string;
}

type Step = "idle" | "uploading" | "extracting" | "review" | "saving" | "done" | "error";

const ROLE_LABELS: Record<string, string> = {
  assessor: "Registered Assessor",
  facilitator: "Registered Facilitator",
  moderator: "Registered Moderator",
  sdf: "Skills Development Facilitator",
  verifier: "Verifier",
  etqa_evaluator: "ETQA Evaluator",
};

async function readPDFAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const uint8 = new Uint8Array(arrayBuffer);
        const decoder = new TextDecoder("latin1");
        const raw = decoder.decode(uint8);
        const textParts: string[] = [];
        const regex = /BT[\s\S]*?ET/g;
        let match;
        while ((match = regex.exec(raw)) !== null) {
          const block = match[0];
          const strRegex = /\(([^)]+)\)/g;
          let strMatch;
          while ((strMatch = strRegex.exec(block)) !== null) {
            const t = strMatch[1].replace(/\\n/g, " ").replace(/\\r/g, " ").trim();
            if (t.length > 1) textParts.push(t);
          }
        }
        const extracted = textParts.join(" ");
        resolve(extracted.length > 100 ? extracted.substring(0, 8000) : raw.substring(0, 8000));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function AccreditationUploaderWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string>("");
  const [draft, setDraft] = useState<ExtractedData | null>(null);
  const [editMode, setEditMode] = useState(false);

  if (!user) return null;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "PDF only", description: "Please upload a PDF accreditation letter.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum 10MB allowed.", variant: "destructive" });
      return;
    }
    setUploadedFile(file);
    setStep("uploading");
    setErrorMsg("");

    try {
      const path = `${user.id}/accreditations/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("documents").upload(path, file);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
      setDocumentUrl(urlData?.publicUrl ?? "");

      setStep("extracting");
      const pdfText = await readPDFAsText(file);

      const { data: fnData, error: fnErr } = await supabase.functions.invoke("extract-accreditation", {
        body: { pdfText },
      });

      if (fnErr) throw fnErr;
      if (fnData?.error) throw new Error(fnData.error);

      const result = fnData.data as ExtractedData;
      setDraft({ ...result });
      setStep("review");
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Extraction failed");
      setStep("error");
    }
  }

  async function handleSave() {
    if (!draft) return;
    setStep("saving");

    try {
      const { data: acc, error: accErr } = await (supabase.from("practitioner_accreditations" as any) as any)
        .insert({
          user_id: user.id,
          seta_body: draft.seta_body,
          role_type: draft.role_type.toLowerCase(),
          registration_number: draft.registration_number || null,
          id_number: draft.id_number || null,
          valid_from: draft.valid_from || null,
          valid_to: draft.valid_to || null,
          status: "active",
          document_url: documentUrl,
          raw_extracted: draft,
        })
        .select("id")
        .single();

      if (accErr) throw accErr;

      if (draft.qualifications?.length > 0) {
        const quals = draft.qualifications.map((q) => ({
          accreditation_id: acc.id,
          user_id: user.id,
          saqa_id: q.saqa_id || null,
          title: q.title,
          nqf_level: q.nqf_level || null,
          credits: q.credits || null,
        }));
        const { error: qualErr } = await (supabase.from("accreditation_qualifications" as any) as any).insert(quals);
        if (qualErr) throw qualErr;
      }

      queryClient.invalidateQueries({ queryKey: ["practitioner_accreditations", user.id] });
      queryClient.invalidateQueries({ queryKey: ["accreditation_qualifications", user.id] });
      queryClient.invalidateQueries({ queryKey: ["credential_wallet", user.id] });

      toast({
        title: "Accreditation saved!",
        description: `${ROLE_LABELS[draft.role_type] ?? draft.role_type} from ${draft.seta_body} added to your profile.`,
      });
      setStep("done");
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Save failed");
      setStep("error");
    }
  }

  function reset() {
    setStep("idle");
    setDraft(null);
    setUploadedFile(null);
    setDocumentUrl("");
    setErrorMsg("");
    setEditMode(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function updateDraftQual(idx: number, field: string, value: string) {
    if (!draft) return;
    const quals = [...draft.qualifications];
    quals[idx] = { ...quals[idx], [field]: value };
    setDraft({ ...draft, qualifications: quals });
  }

  function removeQual(idx: number) {
    if (!draft) return;
    setDraft({ ...draft, qualifications: draft.qualifications.filter((_, i) => i !== idx) });
  }

  // ─── IDLE / ERROR ──────────────────────────────────────────────────────────
  if (step === "idle" || step === "error") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Upload Accreditation Letter</p>
            <p className="text-xs text-muted-foreground">AI extracts all details automatically</p>
          </div>
        </div>

        {step === "error" && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">{errorMsg}</p>
          </div>
        )}

        <div
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground group-hover:text-primary transition-colors" />
          <p className="text-sm font-medium text-foreground mb-1">Drop your PDF letter here</p>
          <p className="text-xs text-muted-foreground">SETA, ETQA, professional body letters accepted</p>
          <p className="text-xs text-muted-foreground mt-1">Max 10MB · PDF only</p>
          <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileSelect} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {["MICT SETA", "SERVICES SETA", "MERSETA", "ETDP SETA", "HWSETA", "CATHSSETA"].map((body) => (
            <div key={body} className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              <Building2 className="w-3 h-3 flex-shrink-0" /> {body}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── UPLOADING / EXTRACTING ────────────────────────────────────────────────
  if (step === "uploading" || step === "extracting") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
          <FileText className="w-8 h-8 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{uploadedFile?.name}</p>
            <p className="text-xs text-muted-foreground">
              {uploadedFile && uploadedFile.size > 1024 * 1024
                ? `${(uploadedFile.size / 1024 / 1024).toFixed(1)} MB`
                : `${Math.round((uploadedFile?.size ?? 0) / 1024)} KB`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
          <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-foreground">
              {step === "uploading" ? "Uploading document securely..." : "AI extracting accreditation data..."}
            </p>
            <p className="text-xs text-muted-foreground">
              {step === "uploading"
                ? "Storing in your private document vault"
                : "Analysing SETA registration, qualifications & dates"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── DONE ──────────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="flex flex-col items-center text-center py-6 space-y-3">
        <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Accreditation Saved!</p>
          <p className="text-xs text-muted-foreground mt-1">Your credentials are now live on your profile</p>
        </div>
        <Button size="sm" variant="outline" onClick={reset}>Upload Another Letter</Button>
      </div>
    );
  }

  // ─── REVIEW / SAVING ───────────────────────────────────────────────────────
  if ((step === "review" || step === "saving") && draft) {
    const roleLabel = ROLE_LABELS[draft.role_type] ?? draft.role_type;
    const isExpired = draft.valid_to ? new Date(draft.valid_to) < new Date() : false;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Review Extracted Data</p>
              <p className="text-xs text-muted-foreground">{draft.qualifications?.length ?? 0} qualifications found</p>
            </div>
          </div>
          <button
            onClick={() => setEditMode(!editMode)}
            className="text-xs text-primary flex items-center gap-1 hover:underline"
          >
            <Edit3 className="w-3 h-3" /> {editMode ? "Done" : "Edit"}
          </button>
        </div>

        {/* Registration card */}
        <div className="rounded-xl border border-border bg-gradient-to-br from-primary/10 to-primary/5 p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-foreground">{draft.practitioner_name || "—"}</p>
              <Badge className="mt-1 text-[10px]" variant="secondary">{roleLabel}</Badge>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Issuing Body</p>
              <p className="text-xs font-bold text-foreground">{draft.seta_body}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5">
              <Hash className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              {editMode ? (
                <Input
                  value={draft.registration_number ?? ""}
                  onChange={(e) => setDraft({ ...draft, registration_number: e.target.value })}
                  className="h-6 text-xs px-1.5"
                  placeholder="Reg number"
                />
              ) : (
                <span className="text-xs text-foreground font-medium">{draft.registration_number || "—"}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Hash className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground">ID: {draft.id_number || "—"}</span>
            </div>
          </div>

          {(draft.valid_from || draft.valid_to) && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              {draft.valid_from && <span>{draft.valid_from}</span>}
              {draft.valid_from && draft.valid_to && <span>→</span>}
              {draft.valid_to && (
                <span className={isExpired ? "text-destructive font-medium" : "text-foreground font-medium"}>
                  {draft.valid_to}{isExpired && " (Expired)"}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Qualifications list */}
        {draft.qualifications?.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                Qualifications ({draft.qualifications.length})
              </p>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              {draft.qualifications.map((q, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50 border border-border">
                  <ChevronRight className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    {editMode ? (
                      <Input
                        value={q.title}
                        onChange={(e) => updateDraftQual(idx, "title", e.target.value)}
                        className="h-6 text-xs mb-1"
                      />
                    ) : (
                      <p className="text-xs font-medium text-foreground leading-snug">{q.title}</p>
                    )}
                    <div className="flex gap-2 mt-0.5 flex-wrap">
                      {q.saqa_id && <span className="text-[10px] text-muted-foreground">SAQA {q.saqa_id}</span>}
                      {q.nqf_level && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                          {q.nqf_level}
                        </span>
                      )}
                      {q.credits && <span className="text-[10px] text-muted-foreground">{q.credits} credits</span>}
                    </div>
                  </div>
                  {editMode && (
                    <button onClick={() => removeQual(idx)} className="text-destructive hover:opacity-80 flex-shrink-0">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={reset} disabled={step === "saving"} className="flex-1">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={step === "saving"} className="flex-1">
            {step === "saving" ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saving...</>
            ) : (
              <><Save className="w-3.5 h-3.5 mr-1.5" />Confirm & Save</>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
