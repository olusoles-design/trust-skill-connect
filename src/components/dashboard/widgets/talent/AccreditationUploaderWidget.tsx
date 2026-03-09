import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Upload, FileText, Loader2, CheckCircle2, AlertCircle,
  Save, RotateCcw, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExtractedQualification {
  saqa_id: string;
  title: string;
  nqf_level: string;
  credits: number;
}

interface ExtractedData {
  practitioner_name: string;
  id_number: string;
  registration_number: string;
  seta_body: string;
  role_type: string;
  valid_from: string | null;
  valid_to: string | null;
  qualifications: ExtractedQualification[];
  evaluator_name?: string;
  senior_manager_name?: string;
  raw_notes?: string;
}

type Step = "idle" | "uploading" | "extracting" | "review" | "saving" | "done" | "error";

const ROLE_LABELS: Record<string, string> = {
  assessor: "Registered Assessor",
  facilitator: "SME (Subject Matter Expert) / Facilitator",
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
        resolve(extracted.length > 100 ? extracted.substring(0, 12000) : raw.substring(0, 12000));
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
  const [dragOver, setDragOver] = useState(false);

  if (!user) return null;

  async function processFile(file: File) {
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
      // 1. Upload to storage
      const path = `${user.id}/accreditations/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("documents").upload(path, file);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
      setDocumentUrl(urlData?.publicUrl ?? "");

      // 2. Extract text from PDF
      setStep("extracting");
      const pdfText = await readPDFAsText(file);

      // 3. Call AI edge function
      const { data: fnData, error: fnErr } = await supabase.functions.invoke("extract-accreditation", {
        body: { pdfText },
      });

      if (fnErr) throw fnErr;
      if (fnData?.error) throw new Error(fnData.error);

      const result = fnData.data as ExtractedData;
      setDraft(result);
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
          role_type: draft.role_type?.toLowerCase() ?? "assessor",
          registration_number: draft.registration_number || null,
          id_number: draft.id_number || null,
          valid_from: draft.valid_from || null,
          valid_to: draft.valid_to || null,
          status: "active",
          document_url: documentUrl,
          raw_extracted: draft as any,
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
        description: `${draft.qualifications?.length ?? 0} qualifications added to your profile.`,
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
    if (fileRef.current) fileRef.current.value = "";
  }

  // ─── IDLE ──────────────────────────────────────────────────────────────────
  if (step === "idle") {
    return (
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all group ${
          dragOver
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/50 hover:bg-primary/5"
        }`}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files[0];
          if (f) processFile(f);
        }}
      >
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <p className="text-sm font-semibold text-foreground mb-1">Drop your SETA Accreditation Letter here</p>
        <p className="text-xs text-muted-foreground">AI will extract all qualifications, registration number &amp; dates automatically</p>
        <p className="text-xs text-muted-foreground mt-1">PDF only · Max 10MB</p>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
        />
      </div>
    );
  }

  // ─── ERROR ─────────────────────────────────────────────────────────────────
  if (step === "error") {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{errorMsg}</p>
        </div>
        <Button size="sm" variant="outline" onClick={reset} className="w-full gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" /> Try Again
        </Button>
      </div>
    );
  }

  // ─── UPLOADING / EXTRACTING ────────────────────────────────────────────────
  if (step === "uploading" || step === "extracting") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <FileText className="w-6 h-6 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{uploadedFile?.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {uploadedFile && uploadedFile.size > 1024 * 1024
                ? `${(uploadedFile.size / 1024 / 1024).toFixed(1)} MB`
                : `${Math.round((uploadedFile?.size ?? 0) / 1024)} KB`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-primary/10">
          <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-foreground">
              {step === "uploading" ? "Uploading document…" : "Extracting accreditation data with AI…"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {step === "uploading"
                ? "Storing securely in your document vault"
                : "Reading qualifications, registration number & validity dates"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── DONE ──────────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="flex flex-col items-center text-center py-4 space-y-3">
        <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Accreditation Saved!</p>
          <p className="text-xs text-muted-foreground mt-0.5">{draft?.qualifications?.length ?? 0} qualifications added to your profile</p>
        </div>
        <Button size="sm" variant="outline" onClick={reset}>Upload Another Letter</Button>
      </div>
    );
  }

  // ─── REVIEW ────────────────────────────────────────────────────────────────
  if ((step === "review" || step === "saving") && draft) {
    const roleLabel = ROLE_LABELS[draft.role_type?.toLowerCase()] ?? draft.role_type;

    return (
      <div className="space-y-4">
        {/* Extracted summary header */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-emerald-700">
              AI extracted {draft.qualifications?.length ?? 0} qualifications
            </p>
            <p className="text-[10px] text-emerald-600/80">Review below then confirm to save</p>
          </div>
        </div>

        {/* Key details */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-muted/50 space-y-0.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Practitioner</p>
            <p className="font-semibold text-foreground truncate">{draft.practitioner_name || "—"}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/50 space-y-0.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Registration No.</p>
            <p className="font-bold text-primary truncate">{draft.registration_number || "—"}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/50 space-y-0.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Role</p>
            <p className="font-semibold text-foreground truncate">{roleLabel}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/50 space-y-0.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Issuing Body</p>
            <p className="font-semibold text-foreground truncate">{draft.seta_body || "—"}</p>
          </div>
          {draft.valid_from && (
            <div className="p-2.5 rounded-lg bg-muted/50 space-y-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Valid From</p>
              <p className="font-semibold text-foreground">{draft.valid_from}</p>
            </div>
          )}
          {draft.valid_to && (
            <div className="p-2.5 rounded-lg bg-muted/50 space-y-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Valid To</p>
              <p className={`font-semibold ${new Date(draft.valid_to) < new Date() ? "text-destructive" : "text-foreground"}`}>
                {draft.valid_to}
              </p>
            </div>
          )}
        </div>

        {/* Qualifications preview */}
        {draft.qualifications?.length > 0 && (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="bg-muted/50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Qualifications ({draft.qualifications.length})
            </div>
            <div className="divide-y divide-border max-h-52 overflow-y-auto">
              {draft.qualifications.map((q, i) => (
                <div key={i} className="flex items-start gap-2.5 px-3 py-2">
                  <span className="text-[10px] font-mono text-muted-foreground mt-0.5 w-12 flex-shrink-0">{q.saqa_id}</span>
                  <p className="text-xs text-foreground flex-1 leading-snug">{q.title}</p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {q.nqf_level && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium whitespace-nowrap">{q.nqf_level}</span>
                    )}
                    {q.credits && (
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{q.credits}cr</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reset} disabled={step === "saving"} className="flex-1">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={step === "saving"} className="flex-1 gap-1.5">
            {step === "saving" ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</>
            ) : (
              <><Save className="w-3.5 h-3.5" />Confirm & Save</>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
