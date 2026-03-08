import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRegulatoryBodies } from "@/hooks/useRegulatoryBodies";
import {
  GraduationCap, FileText, Briefcase, Cpu,
  Upload, Plus, Trash2, BadgeCheck, Clock,
  AlertTriangle, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, ExternalLink, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format, differenceInDays, parseISO } from "date-fns";

// ─── Practitioner role config ─────────────────────────────────────────────────

type PractitionerRole = "Facilitator" | "Assessor" | "Moderator" | "SDF";

const ROLES: {
  key: PractitionerRole;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  description: string;
  docTypes: { value: string; label: string }[];
}[] = [
  {
    key: "Facilitator",
    label: "Facilitator",
    icon: GraduationCap,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
    description: "Delivers training and learning programmes",
    docTypes: [
      { value: "facilitator_registration", label: "SETA Facilitator Registration" },
      { value: "etdp_certificate",         label: "ETDP Certificate" },
      { value: "qualification",            label: "Relevant Qualification" },
      { value: "cv",                       label: "Curriculum Vitae (CV)" },
      { value: "other",                    label: "Other Supporting Document" },
    ],
  },
  {
    key: "Assessor",
    label: "Assessor",
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    description: "Assesses learner competence against unit standards",
    docTypes: [
      { value: "assessor_registration",   label: "SETA Assessor Registration" },
      { value: "assessor_certificate",    label: "Assessor Certificate (NQF 5)" },
      { value: "qualification",           label: "Subject Matter Qualification" },
      { value: "cv",                      label: "Curriculum Vitae (CV)" },
      { value: "other",                   label: "Other Supporting Document" },
    ],
  },
  {
    key: "Moderator",
    label: "Moderator",
    icon: Briefcase,
    color: "text-purple-600",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    description: "Moderates assessment quality and consistency",
    docTypes: [
      { value: "moderator_registration",  label: "SETA Moderator Registration" },
      { value: "moderator_certificate",   label: "Moderator Certificate (NQF 6)" },
      { value: "qualification",           label: "Subject Matter Qualification" },
      { value: "cv",                      label: "Curriculum Vitae (CV)" },
      { value: "other",                   label: "Other Supporting Document" },
    ],
  },
  {
    key: "SDF",
    label: "Skills Development Facilitator (SDF)",
    icon: Cpu,
    color: "text-orange-600",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    description: "Compiles WSP/ATR and liaises with SETAs",
    docTypes: [
      { value: "sdf_registration",        label: "SDF Registration Certificate" },
      { value: "sdf_qualification",       label: "SDF Qualification (NQF 5)" },
      { value: "sabpp_registration",      label: "SABPP / HR Professional Registration" },
      { value: "cv",                      label: "Curriculum Vitae (CV)" },
      { value: "other",                   label: "Other Supporting Document" },
    ],
  },
];

// ─── Status config ────────────────────────────────────────────────────────────

type DocStatus = "pending" | "verified" | "rejected" | "expired";

const STATUS_CFG: Record<DocStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pending:  { label: "Pending", icon: Clock,         color: "text-yellow-600",  bg: "bg-yellow-500/10 border-yellow-500/20"   },
  verified: { label: "Verified", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/20" },
  rejected: { label: "Rejected", icon: XCircle,      color: "text-destructive",  bg: "bg-destructive/10 border-destructive/20" },
  expired:  { label: "Expired",  icon: AlertTriangle, color: "text-orange-600",  bg: "bg-orange-500/10 border-orange-500/20"  },
};

interface AccreditationDoc {
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

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function ExpiryTag({ expires_at }: { expires_at: string | null }) {
  if (!expires_at) return null;
  const days = differenceInDays(parseISO(expires_at), new Date());
  if (days < 0)  return <span className="text-[10px] text-destructive font-medium">Expired {Math.abs(days)}d ago</span>;
  if (days < 30) return <span className="text-[10px] text-orange-600 font-medium">Expires in {days}d</span>;
  return <span className="text-[10px] text-muted-foreground">Exp: {format(parseISO(expires_at), "dd MMM yyyy")}</span>;
}

// ─── Upload form per role ─────────────────────────────────────────────────────

interface UploadFormProps {
  role: typeof ROLES[number];
  userId: string;
  onSuccess: () => void;
}

function UploadForm({ role, userId, onSuccess }: UploadFormProps) {
  const { data: bodies } = useRegulatoryBodies();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    doc_type: role.docTypes[0].value,
    label: "",
    reg_number: "",
    seta_body: "",
    nqf_level: "",
    expires_at: "",
    file: null as File | null,
  });

  const handleUpload = async () => {
    if (!form.file || !form.doc_type) {
      toast.error("Please select a document type and file");
      return;
    }
    setUploading(true);
    try {
      const path = `${userId}/${Date.now()}_${form.file.name}`;
      const { error: storageErr } = await supabase.storage
        .from("documents")
        .upload(path, form.file, { upsert: false });
      if (storageErr) throw storageErr;

      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
      const docType = role.docTypes.find(d => d.value === form.doc_type);

      // Build a descriptive label including role and reg number
      const autoLabel = [
        `${role.key}:`,
        docType?.label ?? form.doc_type,
        form.reg_number ? `(${form.reg_number})` : "",
        form.seta_body ? `– ${form.seta_body}` : "",
      ].filter(Boolean).join(" ");

      const { error: dbErr } = await (supabase.from("document_vault" as any) as any).insert({
        user_id: userId,
        doc_type: `practitioner_${role.key.toLowerCase()}_${form.doc_type}`,
        label: form.label || autoLabel,
        file_url: urlData.publicUrl,
        file_name: form.file.name,
        file_size: form.file.size,
        mime_type: form.file.type,
        expires_at: form.expires_at || null,
        status: "pending",
      });
      if (dbErr) throw dbErr;

      toast.success(`${role.key} document uploaded — pending verification`);
      onSuccess();
      setForm({ doc_type: role.docTypes[0].value, label: "", reg_number: "", seta_body: "", nqf_level: "", expires_at: "", file: null });
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-3 p-4 rounded-xl border border-border bg-muted/20 space-y-3">
      <p className="text-xs font-semibold text-foreground">Upload {role.key} Document</p>

      {/* Two-column grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Document type — full width */}
        <div className="col-span-2 space-y-1">
          <Label className="text-xs text-muted-foreground">Document Type *</Label>
          <Select value={form.doc_type} onValueChange={v => setForm(p => ({ ...p, doc_type: v }))}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {role.docTypes.map(d => (
                <SelectItem key={d.value} value={d.value} className="text-xs">{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* SETA / Body */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Issuing SETA / Body</Label>
          <Select value={form.seta_body} onValueChange={v => setForm(p => ({ ...p, seta_body: v }))}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select body…" />
            </SelectTrigger>
            <SelectContent>
              {(bodies ?? []).map(b => (
                <SelectItem key={b.id} value={b.acronym} className="text-xs">{b.acronym} – {b.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Registration number */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Registration Number</Label>
          <Input
            placeholder="e.g. ETDP-ASS-2023-00891"
            value={form.reg_number}
            onChange={e => setForm(p => ({ ...p, reg_number: e.target.value }))}
            className="h-8 text-xs"
          />
        </div>

        {/* NQF Level */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">NQF Level</Label>
          <Select value={form.nqf_level} onValueChange={v => setForm(p => ({ ...p, nqf_level: v }))}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <SelectItem key={n} value={String(n)} className="text-xs">NQF {n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Expiry */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Expiry Date
          </Label>
          <Input
            type="date"
            value={form.expires_at}
            onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))}
            className="h-8 text-xs"
          />
        </div>

        {/* Custom label — full width */}
        <div className="col-span-2 space-y-1">
          <Label className="text-xs text-muted-foreground">Custom Label (optional)</Label>
          <Input
            placeholder="e.g. ETDP SETA Assessor Cert 2023"
            value={form.label}
            onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* File picker — full width */}
      <div
        className="border-2 border-dashed border-border rounded-lg p-3 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          className="hidden"
          onChange={e => setForm(p => ({ ...p, file: e.target.files?.[0] ?? null }))}
        />
        {form.file ? (
          <p className="text-xs text-primary font-medium">{form.file.name} ({formatSize(form.file.size)})</p>
        ) : (
          <div className="space-y-1">
            <Upload className="w-4 h-4 mx-auto text-muted-foreground" />
            <p className="text-xs text-muted-foreground">PDF, JPG, PNG, DOCX — max 20 MB</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={handleUpload} disabled={uploading}>
          {uploading
            ? <span className="w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            : <Upload className="w-3 h-3" />}
          {uploading ? "Uploading…" : "Upload Document"}
        </Button>
      </div>
    </div>
  );
}

// ─── Role section ─────────────────────────────────────────────────────────────

interface RoleSectionProps {
  role: typeof ROLES[number];
  docs: AccreditationDoc[];
  userId: string;
  onDelete: (id: string) => void;
}

function RoleSection({ role, docs, userId, onDelete }: RoleSectionProps) {
  const Icon = role.icon;
  const [expanded, setExpanded] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const qc = useQueryClient();

  const verifiedCount = docs.filter(d => d.status === "verified").length;

  return (
    <div className={`rounded-xl border-2 ${role.border} overflow-hidden`}>
      {/* Section header */}
      <button
        className={`w-full flex items-center justify-between px-4 py-3 ${role.bg} transition-colors`}
        onClick={() => setExpanded(p => !p)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${role.bg} border ${role.border} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-4 h-4 ${role.color}`} />
          </div>
          <div className="text-left">
            <p className={`text-sm font-bold ${role.color}`}>{role.label}</p>
            <p className="text-xs text-muted-foreground">{role.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {docs.length > 0 && (
            <Badge variant="outline" className={`text-[10px] ${role.color} border-current`}>
              {verifiedCount > 0 && <BadgeCheck className="w-2.5 h-2.5 mr-0.5" />}
              {docs.length} doc{docs.length !== 1 ? "s" : ""}
              {verifiedCount > 0 ? ` · ${verifiedCount} verified` : ""}
            </Badge>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="p-4 space-y-3 bg-card">
          {/* Documents */}
          {docs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              No {role.key} documents uploaded yet.
            </p>
          ) : (
            <div className="space-y-2">
              {docs.map(doc => {
                const cfg = STATUS_CFG[doc.status] ?? STATUS_CFG.pending;
                const SIcon = cfg.icon;
                return (
                  <div key={doc.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30 border border-border group hover:border-primary/20 transition-colors">
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-medium text-foreground truncate">{doc.label}</p>
                        <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>
                          <SIcon className="w-2.5 h-2.5" /> {cfg.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{doc.file_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <ExpiryTag expires_at={doc.expires_at} />
                        {doc.reviewer_note && (
                          <span className="text-[10px] text-muted-foreground italic truncate">"{doc.reviewer_note}"</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" variant="ghost" className="h-6 w-6">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </a>
                      {doc.status === "pending" && (
                        <Button size="icon" variant="ghost" className="h-6 w-6 hover:text-destructive" onClick={() => onDelete(doc.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Upload form toggle */}
          {showUpload ? (
            <>
              <UploadForm
                role={role}
                userId={userId}
                onSuccess={() => {
                  setShowUpload(false);
                  qc.invalidateQueries({ queryKey: ["practitioner_docs"] });
                }}
              />
              <Button size="sm" variant="ghost" className="h-7 text-xs w-full" onClick={() => setShowUpload(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className={`h-7 text-xs gap-1.5 w-full border-dashed ${role.border} ${role.color} hover:${role.bg}`}
              onClick={() => setShowUpload(true)}
            >
              <Plus className="w-3 h-3" /> Add {role.key} Document
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────

export function PractitionerAccreditationsWidget() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Fetch all practitioner-tagged docs from the vault
  const { data: allDocs = [], isLoading } = useQuery<AccreditationDoc[]>({
    queryKey: ["practitioner_docs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase.from("document_vault" as any) as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown) as AccreditationDoc[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("document_vault" as any) as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["practitioner_docs"] });
      toast.success("Document removed");
    },
    onError: () => toast.error("Failed to remove document"),
  });

  // Split docs by role
  const docsForRole = (role: PractitionerRole): AccreditationDoc[] =>
    allDocs.filter(d => d.doc_type.startsWith(`practitioner_${role.toLowerCase()}_`));

  // Also include CV documents (any doc_type === "cv")
  const cvDocs = allDocs.filter(d => d.doc_type === "cv" || d.doc_type.includes("_cv"));

  const totalVerified = allDocs.filter(d => d.status === "verified").length;
  const totalDocs     = allDocs.length;

  if (!user) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Practitioner Accreditations</h3>
          <p className="text-xs text-muted-foreground">Upload statutory documents per role — auto-reflected in your profile</p>
        </div>
        {totalDocs > 0 && (
          <div className="text-right">
            <p className="text-sm font-bold text-primary">{totalVerified}/{totalDocs}</p>
            <p className="text-[10px] text-muted-foreground">verified</p>
          </div>
        )}
      </div>

      {/* Trust bar */}
      {totalDocs > 0 && (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${totalDocs === 0 ? 0 : Math.round((totalVerified / totalDocs) * 100)}%` }}
          />
        </div>
      )}

      {/* Role sections */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {ROLES.map(role => (
            <RoleSection
              key={role.key}
              role={role}
              docs={docsForRole(role.key)}
              userId={user.id}
              onDelete={id => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Info notice */}
      <div className="flex items-start gap-2 p-3 bg-muted/20 rounded-lg border border-border/50 text-xs text-muted-foreground">
        <BadgeCheck className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
        <span>
          Uploaded documents are reviewed by the platform team. Once <strong className="text-foreground">Verified</strong>, they appear in your Credential Wallet and profile — visible to Employers and Sponsors searching for accredited practitioners.
        </span>
      </div>
    </div>
  );
}
