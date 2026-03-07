import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ShieldCheck, Upload, FileText, AlertTriangle, CheckCircle2,
  Clock, XCircle, Trash2, Plus, Lock, Calendar
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays, parseISO } from "date-fns";

// ── Types ──────────────────────────────────────────────────────────────────────

type DocStatus = "pending" | "verified" | "rejected" | "expired";

interface VaultDoc {
  id: string;
  doc_type: string;
  label: string;
  file_url: string;
  file_name: string;
  file_size: number | null;
  status: DocStatus;
  expires_at: string | null;
  reviewer_note: string | null;
  created_at: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const DOC_TYPES = [
  { value: "tax_clearance",          label: "Tax Clearance Certificate" },
  { value: "bee_affidavit",          label: "B-BBEE Affidavit / Certificate" },
  { value: "accreditation",          label: "SETA Accreditation Certificate" },
  { value: "assessor_registration",  label: "Assessor Registration (ETDP)" },
  { value: "moderator_registration", label: "Moderator Registration (ETDP)" },
  { value: "qualification",          label: "Qualification Certificate" },
  { value: "id_copy",                label: "Identity Document (ID / Passport)" },
  { value: "cipc",                   label: "CIPC Registration Certificate" },
  { value: "other",                  label: "Other Document" },
];

const STATUS_CONFIG: Record<DocStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pending:  { label: "Pending Review", icon: Clock,        color: "text-amber-600",  bg: "bg-amber-500/10 border-amber-500/20" },
  verified: { label: "Verified",       icon: CheckCircle2, color: "text-green-600",  bg: "bg-green-500/10 border-green-500/20" },
  rejected: { label: "Rejected",       icon: XCircle,      color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
  expired:  { label: "Expired",        icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-500/10 border-orange-500/20" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function expiryBadge(expires_at: string | null) {
  if (!expires_at) return null;
  const days = differenceInDays(parseISO(expires_at), new Date());
  if (days < 0)  return <span className="text-xs text-destructive font-medium">Expired {Math.abs(days)}d ago</span>;
  if (days < 30) return <span className="text-xs text-orange-600 font-medium">Expires in {days}d</span>;
  return <span className="text-xs text-muted-foreground">Expires {format(parseISO(expires_at), "dd MMM yyyy")}</span>;
}

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// ── Vault Trust Score ─────────────────────────────────────────────────────────

function TrustScore({ docs }: { docs: VaultDoc[] }) {
  const verified = docs.filter((d) => d.status === "verified").length;
  const total = docs.length;
  const pct = total === 0 ? 0 : Math.round((verified / total) * 100);
  const color = pct >= 80 ? "text-green-600" : pct >= 40 ? "text-amber-600" : "text-muted-foreground";

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
      <div className="w-10 h-10 rounded-full gradient-teal flex items-center justify-center flex-shrink-0">
        <Lock className="w-4 h-4 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-foreground">Vault Trust Score</p>
          <span className={`text-sm font-bold ${color}`}>{pct}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{verified} of {total} documents verified</p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function DocumentVaultWidget() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ doc_type: "", label: "", expires_at: "", file: null as File | null });

  // ── Query ──────────────────────────────────────────────────────────────────
  const { data: docs = [], isLoading } = useQuery<VaultDoc[]>({
    queryKey: ["document_vault", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase.from("document_vault" as any) as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown) as VaultDoc[];
    },
  });

  // ── Delete mutation ────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("document_vault" as any) as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["document_vault"] });
      toast.success("Document removed");
    },
    onError: () => toast.error("Failed to remove document"),
  });

  // ── Upload & save ──────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!form.file || !form.doc_type || !user) {
      toast.error("Please select a document type and file");
      return;
    }
    setUploading(true);
    try {
      const ext = form.file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}_${form.file.name}`;
      const { error: storageErr } = await supabase.storage.from("documents").upload(path, form.file, { upsert: false });
      if (storageErr) throw storageErr;

      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);

      const docType = DOC_TYPES.find((d) => d.value === form.doc_type);
      const { error: dbErr } = await (supabase.from("document_vault" as any) as any).insert({
        user_id: user.id,
        doc_type: form.doc_type,
        label: form.label || docType?.label || form.doc_type,
        file_url: urlData.publicUrl,
        file_name: form.file.name,
        file_size: form.file.size,
        mime_type: form.file.type,
        expires_at: form.expires_at || null,
        status: "pending",
      });
      if (dbErr) throw dbErr;

      toast.success("Document uploaded — pending verification");
      qc.invalidateQueries({ queryKey: ["document_vault"] });
      setForm({ doc_type: "", label: "", expires_at: "", file: null });
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Document Vault</h3>
          <Badge variant="outline" className="text-xs">{docs.length}</Badge>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => setShowForm((p) => !p)}>
          <Plus className="w-3 h-3" /> Add Document
        </Button>
      </div>

      {/* Trust score */}
      {docs.length > 0 && <TrustScore docs={docs} />}

      {/* Upload form */}
      {showForm && (
        <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-3">
          <p className="text-xs font-medium text-foreground">Upload a compliance document</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs text-muted-foreground">Document Type *</Label>
              <Select value={form.doc_type} onValueChange={(v) => setForm((p) => ({ ...p, doc_type: v }))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select type…" />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((d) => (
                    <SelectItem key={d.value} value={d.value} className="text-xs">{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Custom Label</Label>
              <Input
                placeholder="e.g. SETA Cert 2024"
                value={form.label}
                onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Expiry Date
              </Label>
              <Input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm((p) => ({ ...p, expires_at: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* File picker */}
          <div
            className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="hidden"
              onChange={(e) => setForm((p) => ({ ...p, file: e.target.files?.[0] ?? null }))}
            />
            {form.file ? (
              <p className="text-xs text-primary font-medium">{form.file.name} ({formatSize(form.file.size)})</p>
            ) : (
              <div className="space-y-1">
                <Upload className="w-5 h-5 mx-auto text-muted-foreground" />
                <p className="text-xs text-muted-foreground">PDF, JPG, PNG, DOCX — max 20 MB</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={handleUpload} disabled={uploading}>
              {uploading ? <span className="w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Upload className="w-3 h-3" />}
              {uploading ? "Uploading…" : "Upload Document"}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Document list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <Lock className="w-8 h-8 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Your Document Vault is empty</p>
          <p className="text-xs text-muted-foreground/70">Upload compliance documents to become visible to Sponsors</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => {
            const cfg = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.pending;
            const Icon = cfg.icon;
            return (
              <div key={doc.id} className="flex items-start gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary/20 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-medium text-foreground truncate">{doc.label}</p>
                    <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>
                      <Icon className="w-3 h-3" /> {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{doc.file_name} {doc.file_size ? `· ${formatSize(doc.file_size)}` : ""}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {expiryBadge(doc.expires_at)}
                    {doc.reviewer_note && (
                      <span className="text-xs text-muted-foreground italic truncate">"{doc.reviewer_note}"</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                    <Button size="icon" variant="ghost" className="h-6 w-6">
                      <FileText className="w-3 h-3" />
                    </Button>
                  </a>
                  {doc.status === "pending" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 hover:text-destructive"
                      onClick={() => deleteMutation.mutate(doc.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Visibility notice */}
      <div className="flex items-start gap-2 p-3 bg-muted/20 rounded-lg border border-border/50 text-xs text-muted-foreground">
        <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
        <span>Your profile is only visible to Sponsors and Employers once at least one document is <strong className="text-foreground">Verified</strong>.</span>
      </div>
    </div>
  );
}
