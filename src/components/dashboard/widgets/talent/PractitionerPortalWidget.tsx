/**
 * PractitionerPortalWidget — Enhanced Practitioner Portal
 *
 * Tabs: Profile · Accreditations · Credentials · Sharing · Settings
 *
 * Features:
 *  - Avatar upload & profile editing (skills tags, years of experience)
 *  - AI-powered accreditation letter extraction (Gemini Flash via edge fn)
 *  - CRUD for academic qualifications & vendor certifications
 *  - Secure sharing requests system (inbox + approve/deny + access tokens)
 *  - Sharing settings (global toggle, default duration, watermark)
 *  - Real-time notifications
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  User, GraduationCap, Award, Share2, Settings, Plus, Pencil, Trash2,
  FileText, CheckCircle2, XCircle, Upload, Loader2, RefreshCw, Globe,
  Bell, ShieldCheck, Clock, Lock, Unlock, Star, MapPin, Phone, Linkedin,
  ExternalLink, Tag, CalendarDays, AlertCircle, Eye, Download, Filter,
  ChevronRight, UserCheck, Building2, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  job_title: string | null;
  location: string | null;
  phone: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  avatar_url: string | null;
  skills: string[] | null;
  sharing_settings: {
    allow_requests?: boolean;
    default_approval?: string;
    default_watermark?: boolean;
    default_access_days?: number;
  };
}

interface Accreditation {
  id: string;
  user_id: string;
  role_type: string;
  seta_body: string;
  registration_number: string | null;
  valid_from: string | null;
  valid_to: string | null;
  document_url: string | null;
  shareable: boolean;
  status: string;
  id_number: string | null;
  raw_extracted: Record<string, unknown> | null;
  created_at: string;
}

interface AccreditationQualification {
  id: string;
  accreditation_id: string;
  user_id: string;
  saqa_id: string | null;
  title: string;
  nqf_level: string | null;
  credits: number | null;
}

interface AcademicCredential {
  id: string;
  user_id: string;
  qualification_type: string;
  field_of_study: string | null;
  institution: string;
  completion_year: number | null;
  status: string;
  document_url: string | null;
  shareable: boolean;
  created_at: string;
}

interface VendorCredential {
  id: string;
  user_id: string;
  certification_name: string;
  vendor: string;
  credential_id: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  document_url: string | null;
  shareable: boolean;
  created_at: string;
}

interface SharingRequest {
  id: string;
  requester_id: string;
  practitioner_id: string;
  message: string;
  requested_types: string[];
  status: string;
  approved_at: string | null;
  access_expiry: string | null;
  created_at: string;
}

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  assessor: "Assessor",
  facilitator: "Facilitator",
  moderator: "Moderator",
  sdf: "SDF",
  verifier: "Verifier",
  etqa_evaluator: "ETQA Evaluator",
};

const STATUS_PILL: Record<string, string> = {
  pending:  "bg-warning/15 text-warning border-warning/30",
  approved: "bg-success/15 text-success border-success/30",
  denied:   "bg-destructive/15 text-destructive border-destructive/30",
  expired:  "bg-muted text-muted-foreground border-border",
};

const QUAL_TYPES = [
  "National Certificate", "National Diploma", "Bachelor's Degree",
  "Honours Degree", "Master's Degree", "PhD/Doctorate",
  "Higher Certificate", "Postgraduate Diploma", "Other",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isExpired(date?: string | null) {
  if (!date) return false;
  return new Date(date) < new Date();
}

function expiryClass(date?: string | null) {
  if (!date) return "text-muted-foreground";
  if (isExpired(date)) return "text-destructive font-medium";
  const diff = new Date(date).getTime() - Date.now();
  if (diff < 60 * 24 * 60 * 60 * 1000) return "text-warning font-medium";
  return "text-foreground";
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── SkillTag ─────────────────────────────────────────────────────────────────

function SkillTag({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium border border-primary/20">
      {label}
      {onRemove && (
        <button onClick={onRemove} className="hover:text-destructive transition-colors">
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  );
}

// ─── AcademicForm ─────────────────────────────────────────────────────────────

function AcademicForm({
  initial, onSave, onCancel, userId,
}: {
  initial?: Partial<AcademicCredential>;
  onSave: (data: Omit<AcademicCredential, "id" | "user_id" | "created_at">) => Promise<void>;
  onCancel: () => void;
  userId: string;
}) {
  const [form, setForm] = useState({
    qualification_type: initial?.qualification_type ?? "",
    field_of_study: initial?.field_of_study ?? "",
    institution: initial?.institution ?? "",
    completion_year: initial?.completion_year?.toString() ?? "",
    status: initial?.status ?? "completed",
    document_url: initial?.document_url ?? "",
    shareable: initial?.shareable ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const path = `${userId}/academic/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("documents").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("documents").getPublicUrl(path);
      setForm(f => ({ ...f, document_url: data.publicUrl }));
      toast({ title: "File uploaded" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!form.qualification_type || !form.institution) return;
    setSaving(true);
    await onSave({
      qualification_type: form.qualification_type,
      field_of_study: form.field_of_study || null,
      institution: form.institution,
      completion_year: form.completion_year ? parseInt(form.completion_year) : null,
      status: form.status,
      document_url: form.document_url || null,
      shareable: form.shareable,
    } as Omit<AcademicCredential, "id" | "user_id" | "created_at">);
    setSaving(false);
  }

  const isValid = !!form.qualification_type && !!form.institution;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Qualification Type *</Label>
          <Select value={form.qualification_type} onValueChange={v => setForm(f => ({ ...f, qualification_type: v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              {QUAL_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Field of Study</Label>
          <Input className="h-8 text-xs" value={form.field_of_study}
            onChange={e => setForm(f => ({ ...f, field_of_study: e.target.value }))}
            placeholder="e.g. Information Technology" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Institution *</Label>
          <Input className="h-8 text-xs" value={form.institution}
            onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
            placeholder="e.g. University of Johannesburg" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Completion Year</Label>
          <Input className="h-8 text-xs" type="number" min="1970" max="2030"
            value={form.completion_year}
            onChange={e => setForm(f => ({ ...f, completion_year: e.target.value }))}
            placeholder="e.g. 2020" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Status</Label>
          <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="completed" className="text-xs">Completed</SelectItem>
              <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Certificate (optional)</Label>
          <div className="flex gap-1.5">
            <Input className="h-8 text-xs flex-1" value={form.document_url}
              onChange={e => setForm(f => ({ ...f, document_url: e.target.value }))}
              placeholder="URL or upload →" readOnly={uploading} />
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0"
              onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            </Button>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Switch checked={form.shareable} onCheckedChange={v => setForm(f => ({ ...f, shareable: v }))} />
        <Label className="text-xs text-muted-foreground">Available for credential requests</Label>
      </div>
      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" className="flex-1 h-8" onClick={onCancel}>Cancel</Button>
        <Button size="sm" className="flex-1 h-8 gap-1.5" onClick={handleSubmit} disabled={saving || !isValid}>
          {saving && <Loader2 className="w-3 h-3 animate-spin" />} Save
        </Button>
      </div>
    </div>
  );
}

// ─── VendorForm ───────────────────────────────────────────────────────────────

function VendorForm({
  initial, onSave, onCancel, userId,
}: {
  initial?: Partial<VendorCredential>;
  onSave: (data: Omit<VendorCredential, "id" | "user_id" | "created_at">) => Promise<void>;
  onCancel: () => void;
  userId: string;
}) {
  const [form, setForm] = useState({
    certification_name: initial?.certification_name ?? "",
    vendor: initial?.vendor ?? "",
    credential_id: initial?.credential_id ?? "",
    issue_date: initial?.issue_date ?? "",
    expiry_date: initial?.expiry_date ?? "",
    document_url: initial?.document_url ?? "",
    shareable: initial?.shareable ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const path = `${userId}/vendor/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("documents").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("documents").getPublicUrl(path);
      setForm(f => ({ ...f, document_url: data.publicUrl }));
      toast({ title: "File uploaded" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!form.certification_name || !form.vendor) return;
    setSaving(true);
    await onSave({
      certification_name: form.certification_name,
      vendor: form.vendor,
      credential_id: form.credential_id || null,
      issue_date: form.issue_date || null,
      expiry_date: form.expiry_date || null,
      document_url: form.document_url || null,
      shareable: form.shareable,
    } as Omit<VendorCredential, "id" | "user_id" | "created_at">);
    setSaving(false);
  }

  const isValid = !!form.certification_name && !!form.vendor;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Certification Name *</Label>
          <Input className="h-8 text-xs" value={form.certification_name}
            onChange={e => setForm(f => ({ ...f, certification_name: e.target.value }))}
            placeholder="e.g. AWS Solutions Architect" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Vendor / Body *</Label>
          <Input className="h-8 text-xs" value={form.vendor}
            onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
            placeholder="e.g. Amazon Web Services" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Credential ID / Licence</Label>
          <Input className="h-8 text-xs" value={form.credential_id}
            onChange={e => setForm(f => ({ ...f, credential_id: e.target.value }))}
            placeholder="e.g. AWS-123456" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Issue Date</Label>
          <Input className="h-8 text-xs" type="date" value={form.issue_date}
            onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Expiry Date</Label>
          <Input className="h-8 text-xs" type="date" value={form.expiry_date}
            onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Certificate</Label>
          <div className="flex gap-1.5">
            <Input className="h-8 text-xs flex-1" value={form.document_url}
              onChange={e => setForm(f => ({ ...f, document_url: e.target.value }))}
              placeholder="URL or upload →" readOnly={uploading} />
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0"
              onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            </Button>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Switch checked={form.shareable} onCheckedChange={v => setForm(f => ({ ...f, shareable: v }))} />
        <Label className="text-xs text-muted-foreground">Available for credential requests</Label>
      </div>
      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" className="flex-1 h-8" onClick={onCancel}>Cancel</Button>
        <Button size="sm" className="flex-1 h-8 gap-1.5" onClick={handleSubmit} disabled={saving || !isValid}>
          {saving && <Loader2 className="w-3 h-3 animate-spin" />} Save
        </Button>
      </div>
    </div>
  );
}

// ─── AccreditationUploader ────────────────────────────────────────────────────

function AccreditationUploader({ userId, onComplete }: { userId: string; onComplete: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<"idle" | "uploading" | "extracting" | "saving" | "done">("idle");
  const [extracted, setExtracted] = useState<Record<string, unknown> | null>(null);
  const [preview, setPreview] = useState<{ name: string; url: string } | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const [manualForm, setManualForm] = useState({
    role_type: "assessor",
    seta_body: "",
    registration_number: "",
    valid_from: "",
    valid_to: "",
  });

  async function extractText(file: File): Promise<string> {
    // For images, return a note; for PDFs attempt basic extraction
    // We pass the file as base64 to our edge function
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const b64 = (reader.result as string).split(",")[1] ?? "";
        // Return a placeholder — the edge function accepts pdfText
        // For real extraction we'd use a PDF-to-text service
        // Here we pass the file name + type as context
        resolve(`[File: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes — raw binary encoded]`);
      };
      reader.readAsDataURL(file);
    });
  }

  async function processFile(file: File) {
    setProcessing(true);
    setStage("uploading");
    setProgress(10);

    try {
      // 1. Upload to storage
      const path = `${userId}/accreditations/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
      setProgress(35);
      setStage("extracting");

      // 2. Read as text (PDF text extraction)
      let pdfText = "";
      if (file.type === "application/pdf") {
        pdfText = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            // Best-effort text extraction from PDF binary
            const text = reader.result as string;
            // Extract readable ASCII chars as a heuristic
            const readable = text.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ");
            resolve(readable.slice(0, 8000));
          };
          reader.readAsBinaryString(file);
        });
      }

      setProgress(55);

      // 3. Call AI extraction
      let aiData: Record<string, unknown> | null = null;
      try {
        const { data: fnData, error: fnErr } = await supabase.functions.invoke(
          "extract-accreditation",
          { body: { pdfText: pdfText || `File name: ${file.name}. Please extract accreditation data.` } }
        );
        if (!fnErr && fnData?.data) {
          aiData = fnData.data as Record<string, unknown>;
        }
      } catch {
        // AI failed — fall back to manual
      }

      setProgress(75);
      setStage("saving");

      if (aiData) {
        setExtracted({ ...aiData, document_url: urlData.publicUrl });
        // Pre-fill manual form with extracted data
        setManualForm({
          role_type: (aiData.role_type as string) || "assessor",
          seta_body: (aiData.seta_body as string) || "",
          registration_number: (aiData.registration_number as string) || "",
          valid_from: (aiData.valid_from as string) || "",
          valid_to: (aiData.valid_to as string) || "",
        });
      }

      setPreview({ name: file.name, url: urlData.publicUrl });
      setProgress(100);
      setStage("done");
      toast({ title: aiData ? "Data extracted via AI — review & save" : "File uploaded — enter details manually" });
    } catch (e) {
      toast({ title: "Processing failed", description: String(e), variant: "destructive" });
      setStage("idle");
      setProgress(0);
    } finally {
      setProcessing(false);
    }
  }

  async function handleSave() {
    if (!preview) return;
    setProcessing(true);
    try {
      const quals = (extracted?.qualifications as Array<{ saqa_id?: string; title: string; nqf_level?: string; credits?: number }>) || [];

      const { data: accData, error } = await (supabase.from("practitioner_accreditations" as any) as any).insert({
        user_id: userId,
        role_type: manualForm.role_type,
        seta_body: manualForm.seta_body,
        registration_number: manualForm.registration_number || null,
        valid_from: manualForm.valid_from || null,
        valid_to: manualForm.valid_to || null,
        document_url: preview.url,
        shareable: true,
        status: "active",
        id_number: (extracted?.id_number as string) || null,
        raw_extracted: extracted ?? {},
      }).select().single();

      if (error) throw error;

      // Save qualifications if extracted
      if (quals.length > 0 && accData?.id) {
        const qualsToInsert = quals.map((q) => ({
          accreditation_id: accData.id,
          user_id: userId,
          saqa_id: q.saqa_id || null,
          title: q.title,
          nqf_level: q.nqf_level || null,
          credits: q.credits || null,
        }));
        await (supabase.from("accreditation_qualifications" as any) as any).insert(qualsToInsert);
      }

      toast({ title: "Accreditation saved!", description: `${quals.length} qualifications linked.` });
      qc.invalidateQueries({ queryKey: ["practitioner_accreditations"] });
      qc.invalidateQueries({ queryKey: ["accreditation_qualifications"] });
      onComplete();
      resetForm();
    } catch (e) {
      toast({ title: "Save failed", description: String(e), variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  }

  function resetForm() {
    setStage("idle");
    setProgress(0);
    setExtracted(null);
    setPreview(null);
    setManualMode(false);
    setManualForm({ role_type: "assessor", seta_body: "", registration_number: "", valid_from: "", valid_to: "" });
  }

  const STAGE_LABELS: Record<string, string> = {
    uploading: "Uploading document…",
    extracting: "Extracting data with AI…",
    saving: "Processing results…",
    done: "Ready — review & save",
  };

  return (
    <div className="space-y-4">
      {stage === "idle" ? (
        <div
          className={cn(
            "relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
            dragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-muted/30"
          )}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) processFile(file);
          }}
          onClick={() => fileRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Upload Accreditation Letter</p>
              <p className="text-xs text-muted-foreground mt-1">Drag & drop or click — PDF, JPEG, PNG up to 20MB</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <ShieldCheck className="w-3 h-3 text-success" />
              <span>AI-powered data extraction from SETA letters</span>
            </div>
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
        </div>
      ) : stage !== "done" ? (
        <div className="p-5 rounded-xl border border-border bg-card space-y-3">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <p className="text-xs font-medium text-foreground">{STAGE_LABELS[stage]}</p>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* File preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
            <FileText className="w-5 h-5 text-success shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{preview?.name}</p>
              <p className="text-[10px] text-muted-foreground">AI extraction complete</p>
            </div>
            <a href={preview?.url} target="_blank" rel="noreferrer">
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
            </a>
          </div>

          {/* Extracted / Manual form */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-foreground">Review Extracted Data</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Role Type *</Label>
                <Select value={manualForm.role_type} onValueChange={v => setManualForm(f => ({ ...f, role_type: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">SETA Body *</Label>
                <Input className="h-8 text-xs" value={manualForm.seta_body}
                  onChange={e => setManualForm(f => ({ ...f, seta_body: e.target.value }))}
                  placeholder="e.g. MICT SETA" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Registration Number</Label>
                <Input className="h-8 text-xs font-mono" value={manualForm.registration_number}
                  onChange={e => setManualForm(f => ({ ...f, registration_number: e.target.value }))}
                  placeholder="e.g. RAS/07/2018/0051" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Valid From</Label>
                <Input className="h-8 text-xs" type="date" value={manualForm.valid_from}
                  onChange={e => setManualForm(f => ({ ...f, valid_from: e.target.value }))} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-medium">Valid To</Label>
                <Input className="h-8 text-xs" type="date" value={manualForm.valid_to}
                  onChange={e => setManualForm(f => ({ ...f, valid_to: e.target.value }))} />
              </div>
            </div>

            {/* Qualifications preview */}
            {((extracted?.qualifications as unknown[]) || []).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Qualifications extracted: <span className="text-foreground">{(extracted!.qualifications as unknown[]).length}</span>
                </p>
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-[10px] h-7">SAQA ID</TableHead>
                        <TableHead className="text-[10px] h-7">Title</TableHead>
                        <TableHead className="text-[10px] h-7">NQF</TableHead>
                        <TableHead className="text-[10px] h-7">Credits</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {((extracted!.qualifications as Array<{ saqa_id?: string; title: string; nqf_level?: string; credits?: number }>) || []).map((q, i) => (
                        <TableRow key={i} className="text-[11px]">
                          <TableCell className="font-mono text-primary">{q.saqa_id || "—"}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{q.title}</TableCell>
                          <TableCell>{q.nqf_level || "—"}</TableCell>
                          <TableCell>{q.credits ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="h-8" onClick={resetForm}>Discard</Button>
            <Button size="sm" className="flex-1 h-8 gap-1.5" onClick={handleSave}
              disabled={processing || !manualForm.seta_body}>
              {processing && <Loader2 className="w-3 h-3 animate-spin" />}
              Save Accreditation
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RequestModal ─────────────────────────────────────────────────────────────

function RequestModal({ practitionerId, onClose }: { practitionerId: string; onClose: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const TYPE_OPTIONS = [
    { value: "accreditations", label: "SETA Accreditations", icon: Award },
    { value: "academic", label: "Academic Qualifications", icon: GraduationCap },
    { value: "vendor", label: "Vendor Certifications", icon: Globe },
  ];

  function toggle(t: string) {
    setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  async function handleSend() {
    if (!user || !message.trim() || types.length === 0) return;
    setSaving(true);
    const { error } = await (supabase.from("sharing_requests" as any) as any).insert({
      requester_id: user.id,
      practitioner_id: practitionerId,
      message: message.trim(),
      requested_types: types,
    });
    if (error) {
      toast({ title: "Failed to send request", variant: "destructive" });
    } else {
      await (supabase.from("notifications" as any) as any).insert({
        user_id: practitionerId,
        type: "sharing_request",
        title: "New Credential Request",
        body: `Someone requested access to your ${types.join(", ")} credentials.`,
        data: { requester_id: user.id, types },
      });
      toast({ title: "Request sent", description: "The practitioner will be notified." });
      onClose();
    }
    setSaving(false);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Credentials</DialogTitle>
          <DialogDescription className="text-xs">Select which credential types you need access to and provide a reason.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Credential Types *</Label>
            <div className="grid grid-cols-1 gap-2">
              {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => toggle(value)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg border text-xs transition-all text-left",
                    types.includes(value)
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                  {types.includes(value) && <CheckCircle2 className="w-3.5 h-3.5 ml-auto" />}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Message *</Label>
            <Textarea
              rows={3}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Explain why you need access to these credentials…"
              className="text-xs resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSend}
            disabled={saving || !message.trim() || types.length === 0}
            className="gap-1.5">
            {saving && <Loader2 className="w-3 h-3 animate-spin" />}
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── ApproveModal ─────────────────────────────────────────────────────────────

function ApproveModal({
  request, onClose, onRefresh,
}: {
  request: SharingRequest;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [days, setDays] = useState("30");
  const [watermark, setWatermark] = useState(true);
  const [saving, setSaving] = useState(false);

  async function handleApprove() {
    setSaving(true);
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + parseInt(days));
    const { error } = await (supabase.from("sharing_requests" as any) as any)
      .update({ status: "approved", approved_at: new Date().toISOString(), access_expiry: expiry.toISOString() })
      .eq("id", request.id);
    if (!error) {
      await (supabase.from("shared_access" as any) as any).insert({
        request_id: request.id,
        expiry: expiry.toISOString(),
        watermark,
        document_urls: [],
      });
      await (supabase.from("notifications" as any) as any).insert({
        user_id: request.requester_id,
        type: "request_approved",
        title: "Credential Request Approved",
        body: `Your credential request has been approved. Access expires ${expiry.toLocaleDateString("en-ZA")}.`,
        data: { request_id: request.id },
      });
      toast({ title: "Request approved" });
      onRefresh();
    }
    setSaving(false);
    onClose();
  }

  async function handleDeny() {
    setSaving(true);
    await (supabase.from("sharing_requests" as any) as any)
      .update({ status: "denied" })
      .eq("id", request.id);
    await (supabase.from("notifications" as any) as any).insert({
      user_id: request.requester_id,
      type: "request_denied",
      title: "Credential Request Declined",
      body: "Your credential request was not approved.",
      data: { request_id: request.id },
    });
    toast({ title: "Request denied" });
    setSaving(false);
    onRefresh();
    onClose();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Respond to Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="p-3 rounded-lg bg-muted/60 space-y-2 text-xs">
            <p className="font-medium text-foreground">Credentials requested:</p>
            <div className="flex flex-wrap gap-1">
              {(request.requested_types || []).map(t => (
                <span key={t} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium capitalize">{t}</span>
              ))}
            </div>
            <p className="font-medium text-foreground mt-2">Message:</p>
            <p className="italic text-muted-foreground">"{request.message}"</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Access Duration (days)</Label>
            <Input className="h-8 text-xs" type="number" min="1" max="365"
              value={days} onChange={e => setDays(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={watermark} onCheckedChange={setWatermark} />
            <Label className="text-xs">Apply watermark to documents</Label>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={handleDeny} disabled={saving} className="gap-1.5">
            <XCircle className="w-3.5 h-3.5" /> Deny
          </Button>
          <Button size="sm" onClick={handleApprove} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── TrustScore ───────────────────────────────────────────────────────────────

function TrustScore({ accreditations, academic, vendor }: {
  accreditations: Accreditation[];
  academic: AcademicCredential[];
  vendor: VendorCredential[];
}) {
  const active = accreditations.filter(a => a.status === "active" && !isExpired(a.valid_to));
  const score = Math.min(100, (active.length * 20) + (academic.length * 10) + (vendor.length * 5));
  const tier = score >= 75 ? "Verified" : score >= 40 ? "Emerging" : "Starter";
  const tierColor = score >= 75 ? "text-success" : score >= 40 ? "text-warning" : "text-muted-foreground";
  const tierBg = score >= 75 ? "bg-success/10" : score >= 40 ? "bg-warning/10" : "bg-muted/60";

  return (
    <div className="p-4 rounded-xl border border-border bg-card shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <p className="text-xs font-semibold text-foreground">Trust Score</p>
        </div>
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", tierBg, tierColor)}>
          {tier}
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-primary tabular-nums">{score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
        <Progress value={score} className="h-2" />
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="text-center">
            <p className="text-sm font-bold text-foreground tabular-nums">{active.length}</p>
            <p className="text-[10px] text-muted-foreground">Active Accreds</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground tabular-nums">{academic.length}</p>
            <p className="text-[10px] text-muted-foreground">Qualifications</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground tabular-nums">{vendor.length}</p>
            <p className="text-[10px] text-muted-foreground">Certifications</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export function PractitionerPortalWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [credSubTab, setCredSubTab] = useState("academic");
  const [sharingSubTab, setSharingSubTab] = useState("inbox");

  // Profile edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name: "", last_name: "", bio: "", job_title: "",
    location: "", phone: "", linkedin_url: "", website_url: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [pendingSkills, setPendingSkills] = useState<string[]>([]);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  // Credential form states
  const [showAcadForm, setShowAcadForm] = useState(false);
  const [editAcad, setEditAcad] = useState<AcademicCredential | null>(null);
  const [acadUploadedUrl, setAcadUploadedUrl] = useState<string | null>(null);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [editVendor, setEditVendor] = useState<VendorCredential | null>(null);
  const [vendorUploadedUrl, setVendorUploadedUrl] = useState<string | null>(null);

  // Accreditation uploader
  const [showUploader, setShowUploader] = useState(false);

  // Sharing state
  const [approveReq, setApproveReq] = useState<SharingRequest | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Settings state
  const [settingsForm, setSettingsForm] = useState({
    allow_requests: true,
    default_approval: "manual",
    default_watermark: true,
    default_access_days: 30,
  });

  // ─── Queries ──────────────────────────────────────────────────────────────

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
      return data as Profile | null;
    },
  });

  const { data: accreditations = [], refetch: refetchAccreds } = useQuery({
    queryKey: ["practitioner_accreditations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase.from("practitioner_accreditations" as any) as any)
        .select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return (data ?? []) as Accreditation[];
    },
  });

  const { data: qualifications = [] } = useQuery({
    queryKey: ["accreditation_qualifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase.from("accreditation_qualifications" as any) as any)
        .select("*").eq("user_id", user!.id);
      return (data ?? []) as AccreditationQualification[];
    },
  });

  const { data: academic = [], refetch: refetchAcademic } = useQuery({
    queryKey: ["academic_credentials", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase.from("academic_credentials" as any) as any)
        .select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return (data ?? []) as AcademicCredential[];
    },
  });

  const { data: vendor = [], refetch: refetchVendor } = useQuery({
    queryKey: ["vendor_credentials", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase.from("vendor_credentials" as any) as any)
        .select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return (data ?? []) as VendorCredential[];
    },
  });

  const { data: inboxRequests = [], refetch: refetchInbox } = useQuery({
    queryKey: ["sharing_requests_inbox", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase.from("sharing_requests" as any) as any)
        .select("*").eq("practitioner_id", user!.id).order("created_at", { ascending: false });
      return (data ?? []) as SharingRequest[];
    },
  });

  const { data: sentRequests = [] } = useQuery({
    queryKey: ["sharing_requests_sent", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase.from("sharing_requests" as any) as any)
        .select("*").eq("requester_id", user!.id).order("created_at", { ascending: false });
      return (data ?? []) as SharingRequest[];
    },
  });

  const { data: notifications = [], refetch: refetchNotifs } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase.from("notifications" as any) as any)
        .select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(30);
      return (data ?? []) as Notification[];
    },
  });

  const unreadCount = notifications.filter(n => !n.read_at).length;
  const pendingInbox = inboxRequests.filter(r => r.status === "pending").length;

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("pp_notifs_" + user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => refetchNotifs())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, refetchNotifs]);

  useEffect(() => {
    if (profile && !editingProfile) {
      setProfileForm({
        first_name: profile.first_name ?? "",
        last_name: profile.last_name ?? "",
        bio: profile.bio ?? "",
        job_title: profile.job_title ?? "",
        location: profile.location ?? "",
        phone: profile.phone ?? "",
        linkedin_url: profile.linkedin_url ?? "",
        website_url: profile.website_url ?? "",
      });
      setPendingSkills(profile.skills ?? []);
      const ss = profile.sharing_settings || {};
      setSettingsForm({
        allow_requests: ss.allow_requests ?? true,
        default_approval: ss.default_approval ?? "manual",
        default_watermark: ss.default_watermark ?? true,
        default_access_days: ss.default_access_days ?? 30,
      });
    }
  }, [profile]);

  // Early return AFTER all hooks
  if (!user) return null;

  // ─── Mutations ────────────────────────────────────────────────────────────

  async function saveProfile() {
    const { error } = await supabase.from("profiles").update({
      first_name: profileForm.first_name,
      last_name: profileForm.last_name,
      bio: profileForm.bio,
      job_title: profileForm.job_title,
      location: profileForm.location,
      phone: profileForm.phone,
      linkedin_url: profileForm.linkedin_url,
      website_url: profileForm.website_url,
      skills: pendingSkills,
    }).eq("user_id", user.id);
    if (error) toast({ title: "Save failed", variant: "destructive" });
    else {
      toast({ title: "Profile updated" });
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
      setEditingProfile(false);
    }
  }

  async function uploadAvatar(file: File) {
    setAvatarUploading(true);
    const path = `${user.id}/avatar_${Date.now()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("user_id", user.id);
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
      toast({ title: "Avatar updated" });
    } else {
      toast({ title: "Upload failed", variant: "destructive" });
    }
    setAvatarUploading(false);
  }

  function addSkill() {
    const s = skillInput.trim();
    if (s && !pendingSkills.includes(s)) {
      setPendingSkills(prev => [...prev, s]);
    }
    setSkillInput("");
  }

  async function saveAcademic(data: Omit<AcademicCredential, "id" | "user_id" | "created_at">) {
    if (editAcad) {
      await (supabase.from("academic_credentials" as any) as any).update(data).eq("id", editAcad.id);
    } else {
      await (supabase.from("academic_credentials" as any) as any).insert({ ...data, user_id: user.id });
    }
    setShowAcadForm(false);
    setEditAcad(null);
    refetchAcademic();
    toast({ title: editAcad ? "Qualification updated" : "Qualification added" });
  }

  async function deleteAcademic(id: string) {
    await (supabase.from("academic_credentials" as any) as any).delete().eq("id", id);
    refetchAcademic();
    toast({ title: "Qualification removed" });
  }

  async function saveVendor(data: Omit<VendorCredential, "id" | "user_id" | "created_at">) {
    if (editVendor) {
      await (supabase.from("vendor_credentials" as any) as any).update(data).eq("id", editVendor.id);
    } else {
      await (supabase.from("vendor_credentials" as any) as any).insert({ ...data, user_id: user.id });
    }
    setShowVendorForm(false);
    setEditVendor(null);
    refetchVendor();
    toast({ title: editVendor ? "Certification updated" : "Certification added" });
  }

  async function deleteVendor(id: string) {
    await (supabase.from("vendor_credentials" as any) as any).delete().eq("id", id);
    refetchVendor();
    toast({ title: "Certification removed" });
  }

  async function deleteAccreditation(id: string) {
    await (supabase.from("practitioner_accreditations" as any) as any).delete().eq("id", id);
    refetchAccreds();
    toast({ title: "Accreditation removed" });
  }

  async function markAllRead() {
    await (supabase.from("notifications" as any) as any)
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
    refetchNotifs();
  }

  async function saveSettings() {
    const { error } = await supabase.from("profiles").update({
      sharing_settings: settingsForm,
    }).eq("user_id", user.id);
    if (error) toast({ title: "Save failed", variant: "destructive" });
    else {
      toast({ title: "Settings saved" });
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
    }
  }

  // ─── Derived ──────────────────────────────────────────────────────────────

  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || user.email?.split("@")[0] || "Practitioner";
  const roleTypes = [...new Set(accreditations.map(a => a.role_type))];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Widget header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground leading-tight">Practitioner Portal</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage credentials, sharing & professional profile</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => setActiveTab("notifications")}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
            >
              <Bell className="w-3 h-3" />
              {unreadCount}
            </button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 h-9 w-full text-[10px]">
          <TabsTrigger value="profile" className="gap-1 text-[10px]">
            <User className="w-3 h-3" /> Profile
          </TabsTrigger>
          <TabsTrigger value="accreditations" className="gap-1 text-[10px]">
            <Award className="w-3 h-3" /> Accreds
          </TabsTrigger>
          <TabsTrigger value="credentials" className="gap-1 text-[10px]">
            <GraduationCap className="w-3 h-3" /> Creds
          </TabsTrigger>
          <TabsTrigger value="sharing" className="gap-1 text-[10px] relative">
            <Share2 className="w-3 h-3" /> Sharing
            {pendingInbox > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-destructive rounded-full" />
            )}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1 text-[10px] relative">
            <Bell className="w-3 h-3" /> Alerts
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1 text-[10px]">
            <Settings className="w-3 h-3" /> Settings
          </TabsTrigger>
        </TabsList>

        {/* ══════════════ PROFILE TAB ══════════════ */}
        <TabsContent value="profile" className="mt-4 space-y-4">
          {/* Profile Card */}
          <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-sm)] overflow-hidden">
            {/* Header banner */}
            <div className="h-20 bg-gradient-to-r from-primary to-primary/70 relative">
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='0.3'%3E%3Ccircle cx='10' cy='10' r='2'/%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/svg%3E\")" }} />
            </div>

            <div className="px-5 pb-5">
              {/* Avatar + edit button */}
              <div className="flex items-end justify-between -mt-10 mb-4">
                <div className="relative">
                  <div
                    className="w-20 h-20 rounded-2xl border-4 border-card bg-muted overflow-hidden cursor-pointer hover:opacity-90 transition-opacity shadow-md"
                    onClick={() => avatarRef.current?.click()}
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10">
                        <span className="text-2xl font-bold text-primary">
                          {displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {avatarUploading && (
                      <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  <button
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-sm hover:bg-primary/90 transition-colors"
                    onClick={() => avatarRef.current?.click()}
                  >
                    <Upload className="w-3 h-3 text-primary-foreground" />
                  </button>
                  <input ref={avatarRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
                </div>
                <Button
                  variant={editingProfile ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={editingProfile ? saveProfile : () => setEditingProfile(true)}
                >
                  {editingProfile ? (
                    <><CheckCircle2 className="w-3 h-3" /> Save</>
                  ) : (
                    <><Pencil className="w-3 h-3" /> Edit Profile</>
                  )}
                </Button>
              </div>

              {editingProfile ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Input className="h-8 text-xs" placeholder="First name"
                      value={profileForm.first_name}
                      onChange={e => setProfileForm(f => ({ ...f, first_name: e.target.value }))} />
                    <Input className="h-8 text-xs" placeholder="Last name"
                      value={profileForm.last_name}
                      onChange={e => setProfileForm(f => ({ ...f, last_name: e.target.value }))} />
                  </div>
                  <Input className="h-8 text-xs" placeholder="Job title / speciality"
                    value={profileForm.job_title}
                    onChange={e => setProfileForm(f => ({ ...f, job_title: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                      <Input className="h-8 text-xs" placeholder="Location"
                        value={profileForm.location}
                        onChange={e => setProfileForm(f => ({ ...f, location: e.target.value }))} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                      <Input className="h-8 text-xs" placeholder="Phone"
                        value={profileForm.phone}
                        onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input className="h-8 text-xs" placeholder="LinkedIn URL"
                      value={profileForm.linkedin_url}
                      onChange={e => setProfileForm(f => ({ ...f, linkedin_url: e.target.value }))} />
                    <Input className="h-8 text-xs" placeholder="Website URL"
                      value={profileForm.website_url}
                      onChange={e => setProfileForm(f => ({ ...f, website_url: e.target.value }))} />
                  </div>
                  <Textarea className="text-xs resize-none" rows={2} placeholder="Short professional bio…"
                    value={profileForm.bio}
                    onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))} />

                  {/* Skills editor */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Skills & Specialties</Label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {pendingSkills.map(s => (
                        <SkillTag key={s} label={s} onRemove={() => setPendingSkills(prev => prev.filter(x => x !== s))} />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input className="h-7 text-xs flex-1" placeholder="Add skill… e.g. Assessor, IT, SETA"
                        value={skillInput}
                        onChange={e => setSkillInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} />
                      <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={addSkill}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground"
                    onClick={() => setEditingProfile(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <h3 className="text-base font-bold text-foreground leading-tight">{displayName}</h3>
                    <p className="text-sm text-muted-foreground">{profile?.job_title || "Practitioner"}</p>
                  </div>
                  {profile?.bio && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{profile.bio}</p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {profile?.location && (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="w-3 h-3" />{profile.location}
                      </span>
                    )}
                    {profile?.phone && (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Phone className="w-3 h-3" />{profile.phone}
                      </span>
                    )}
                    {profile?.linkedin_url && (
                      <a href={profile.linkedin_url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-[11px] text-primary hover:underline">
                        <Linkedin className="w-3 h-3" />LinkedIn
                      </a>
                    )}
                    {profile?.website_url && (
                      <a href={profile.website_url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-[11px] text-primary hover:underline">
                        <Globe className="w-3 h-3" />Website
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Skills tags */}
          {!editingProfile && (profile?.skills ?? []).length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3 h-3" /> Skills & Specialties
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(profile?.skills ?? []).map(s => <SkillTag key={s} label={s} />)}
              </div>
            </div>
          )}

          {/* Roles held */}
          {roleTypes.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3 h-3" /> Accreditation Roles
              </p>
              <div className="flex flex-wrap gap-1.5">
                {roleTypes.map(rt => (
                  <span key={rt} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/20 text-accent-foreground text-[11px] font-medium border border-accent/30">
                    <ShieldCheck className="w-3 h-3" />
                    {ROLE_LABELS[rt] || rt}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Trust Score */}
          <TrustScore accreditations={accreditations} academic={academic} vendor={vendor} />
        </TabsContent>

        {/* ══════════════ ACCREDITATIONS TAB ══════════════ */}
        <TabsContent value="accreditations" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">SETA Accreditation Letters</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {accreditations.length} record{accreditations.length !== 1 ? "s" : ""} ·
                {accreditations.filter(a => !isExpired(a.valid_to)).length} active
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => refetchAccreds()}>
                <RefreshCw className="w-3 h-3" />
              </Button>
              <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowUploader(!showUploader)}>
                <Upload className="w-3 h-3" />
                {showUploader ? "Close" : "Upload Letter"}
              </Button>
            </div>
          </div>

          {/* Uploader panel */}
          {showUploader && (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
              <AccreditationUploader
                userId={user.id}
                onComplete={() => { setShowUploader(false); refetchAccreds(); }}
              />
            </div>
          )}

          {accreditations.length === 0 && !showUploader ? (
            <div className="p-10 text-center rounded-xl border-2 border-dashed border-border">
              <Award className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm font-semibold text-foreground">No accreditations yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Upload a SETA accreditation letter to get started</p>
              <Button size="sm" className="gap-1.5" onClick={() => setShowUploader(true)}>
                <Upload className="w-3.5 h-3.5" /> Upload Letter
              </Button>
            </div>
          ) : accreditations.length > 0 && (
            <div className="space-y-3">
              {accreditations.map(a => {
                const quals = qualifications.filter(q => q.accreditation_id === a.id);
                const expired = isExpired(a.valid_to);
                return (
                  <div key={a.id} className={cn(
                    "rounded-xl border bg-card shadow-[var(--shadow-sm)] overflow-hidden",
                    expired ? "border-destructive/20 opacity-75" : "border-border"
                  )}>
                    <div className="flex items-start justify-between p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                          expired ? "bg-destructive/10" : "bg-primary/10"
                        )}>
                          <Award className={cn("w-4.5 h-4.5", expired ? "text-destructive" : "text-primary")} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-foreground capitalize">
                              {ROLE_LABELS[a.role_type] || a.role_type}
                            </p>
                            {expired && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/15 text-destructive font-medium">Expired</span>
                            )}
                            {a.shareable && !expired && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/15 text-success font-medium">Shareable</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{a.seta_body}</p>
                          {a.registration_number && (
                            <p className="text-[10px] font-mono text-primary/70 mt-0.5">{a.registration_number}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {a.document_url && (
                          <a href={a.document_url} target="_blank" rel="noreferrer">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <FileText className="w-3.5 h-3.5 text-primary" />
                            </Button>
                          </a>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteAccreditation(a.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Validity bar */}
                    <div className="px-4 pb-3 flex items-center gap-4 text-[10px] text-muted-foreground border-t border-border/50 pt-2.5">
                      {a.valid_from && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          From: {fmtDate(a.valid_from)}
                        </span>
                      )}
                      {a.valid_to && (
                        <span className={cn("flex items-center gap-1", expiryClass(a.valid_to))}>
                          <Clock className="w-3 h-3" />
                          To: {fmtDate(a.valid_to)}
                        </span>
                      )}
                      {quals.length > 0 && (
                        <span className="flex items-center gap-1 ml-auto text-primary">
                          <GraduationCap className="w-3 h-3" />
                          {quals.length} qualification{quals.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {/* Qualifications sub-table */}
                    {quals.length > 0 && (
                      <div className="border-t border-border/50 bg-muted/20">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-transparent">
                              <TableHead className="text-[9px] h-7 font-medium text-muted-foreground">SAQA ID</TableHead>
                              <TableHead className="text-[9px] h-7 font-medium text-muted-foreground">Qualification</TableHead>
                              <TableHead className="text-[9px] h-7 font-medium text-muted-foreground">NQF</TableHead>
                              <TableHead className="text-[9px] h-7 font-medium text-muted-foreground">Credits</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {quals.map(q => (
                              <TableRow key={q.id} className="text-[11px] border-b border-border/40">
                                <TableCell className="font-mono text-primary py-1.5">{q.saqa_id || "—"}</TableCell>
                                <TableCell className="py-1.5 max-w-[200px]">
                                  <span className="truncate block">{q.title}</span>
                                </TableCell>
                                <TableCell className="py-1.5">{q.nqf_level || "—"}</TableCell>
                                <TableCell className="py-1.5 tabular-nums">{q.credits ?? "—"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ══════════════ CREDENTIALS TAB ══════════════ */}
        <TabsContent value="credentials" className="mt-4 space-y-4">
          <Tabs value={credSubTab} onValueChange={setCredSubTab}>
            <div className="flex items-center justify-between gap-3">
              <TabsList className="h-8 gap-1">
                <TabsTrigger value="academic" className="text-xs h-7 gap-1">
                  <GraduationCap className="w-3 h-3" /> Academic
                  {academic.length > 0 && (
                    <Badge variant="secondary" className="text-[9px] h-4 px-1 ml-0.5">{academic.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="vendor" className="text-xs h-7 gap-1">
                  <Globe className="w-3 h-3" /> Vendor
                  {vendor.length > 0 && (
                    <Badge variant="secondary" className="text-[9px] h-4 px-1 ml-0.5">{vendor.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-1.5">
                {credSubTab === "academic" ? (
                  <Button size="sm" className="h-7 text-xs gap-1.5"
                    onClick={() => { setShowAcadForm(true); setEditAcad(null); }}>
                    <Plus className="w-3 h-3" /> Add Qualification
                  </Button>
                ) : (
                  <Button size="sm" className="h-7 text-xs gap-1.5"
                    onClick={() => { setShowVendorForm(true); setEditVendor(null); }}>
                    <Plus className="w-3 h-3" /> Add Certification
                  </Button>
                )}
              </div>
            </div>

            {/* ── Academic Qualifications ── */}
            <TabsContent value="academic" className="mt-3 space-y-3">
              {/* Upload zone – always visible at top */}
              <CredentialUploadZone
                userId={user.id}
                credType="academic"
                onUploaded={(url) => {
                  setShowAcadForm(true);
                  setEditAcad(null);
                  // stash the URL so AcademicForm picks it up via initial prop
                  setAcadUploadedUrl(url);
                }}
              />

              {/* Add / Edit form */}
              {(showAcadForm || editAcad) && (
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
                  <p className="text-xs font-semibold text-primary mb-3">
                    {editAcad ? "Edit Qualification" : "Add Qualification"}
                  </p>
                  <AcademicForm
                    initial={editAcad ?? (acadUploadedUrl ? { document_url: acadUploadedUrl } : undefined)}
                    onSave={async (data) => { await saveAcademic(data); setAcadUploadedUrl(null); }}
                    onCancel={() => { setShowAcadForm(false); setEditAcad(null); setAcadUploadedUrl(null); }}
                    userId={user.id}
                  />
                </div>
              )}

              {academic.length === 0 && !showAcadForm ? (
                <div className="p-6 text-center rounded-xl border-2 border-dashed border-border">
                  <GraduationCap className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-medium text-foreground">No academic qualifications yet</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Upload a certificate above or click Add Qualification</p>
                </div>
              ) : academic.length > 0 && (
                <div className="rounded-xl border border-border overflow-hidden shadow-[var(--shadow-sm)]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="text-[10px] h-8">Qualification</TableHead>
                        <TableHead className="text-[10px] h-8 hidden sm:table-cell">Institution</TableHead>
                        <TableHead className="text-[10px] h-8 hidden md:table-cell">Year</TableHead>
                        <TableHead className="text-[10px] h-8">Status</TableHead>
                        <TableHead className="text-[10px] h-8">Shareable</TableHead>
                        <TableHead className="text-[10px] h-8 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {academic.map(a => (
                        <TableRow key={a.id} className="text-xs">
                          <TableCell className="font-medium">
                            <div className="min-w-0">
                              <p className="truncate max-w-[130px]">{a.qualification_type}</p>
                              {a.field_of_study && (
                                <p className="text-[10px] text-muted-foreground truncate max-w-[130px]">{a.field_of_study}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground hidden sm:table-cell max-w-[110px]">
                            <span className="truncate block">{a.institution}</span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell tabular-nums text-muted-foreground">{a.completion_year || "—"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={a.status === "completed" ? "default" : "secondary"}
                              className="text-[9px] h-4 px-1.5"
                            >
                              {a.status === "completed" ? "Done" : "In Progress"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <button
                              title={a.shareable ? "Shareable — click to disable" : "Not shareable — click to enable"}
                              onClick={async () => {
                                await (supabase.from("academic_credentials" as any) as any)
                                  .update({ shareable: !a.shareable }).eq("id", a.id);
                                refetchAcademic();
                              }}
                              className={cn(
                                "flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded transition-colors",
                                a.shareable
                                  ? "bg-success/15 text-success hover:bg-success/25"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              )}
                            >
                              {a.shareable ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                              {a.shareable ? "On" : "Off"}
                            </button>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-0.5">
                              {a.document_url && (
                                <a href={a.document_url} target="_blank" rel="noreferrer" title="View document">
                                  <button className="p-1.5 rounded hover:bg-primary/10 transition-colors">
                                    <FileText className="w-3.5 h-3.5 text-primary" />
                                  </button>
                                </a>
                              )}
                              <button className="p-1.5 rounded hover:bg-muted transition-colors" title="Edit"
                                onClick={() => { setEditAcad(a); setShowAcadForm(false); setAcadUploadedUrl(null); }}>
                                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                              <button className="p-1.5 rounded hover:bg-destructive/10 transition-colors" title="Delete"
                                onClick={() => deleteAcademic(a.id)}>
                                <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* ── Vendor / International Certifications ── */}
            <TabsContent value="vendor" className="mt-3 space-y-3">
              {/* Upload zone */}
              <CredentialUploadZone
                userId={user.id}
                credType="vendor"
                onUploaded={(url) => {
                  setShowVendorForm(true);
                  setEditVendor(null);
                  setVendorUploadedUrl(url);
                }}
              />

              {/* Add / Edit form */}
              {(showVendorForm || editVendor) && (
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
                  <p className="text-xs font-semibold text-primary mb-3">
                    {editVendor ? "Edit Certification" : "Add Certification"}
                  </p>
                  <VendorForm
                    initial={editVendor ?? (vendorUploadedUrl ? { document_url: vendorUploadedUrl } : undefined)}
                    onSave={async (data) => { await saveVendor(data); setVendorUploadedUrl(null); }}
                    onCancel={() => { setShowVendorForm(false); setEditVendor(null); setVendorUploadedUrl(null); }}
                    userId={user.id}
                  />
                </div>
              )}

              {vendor.length === 0 && !showVendorForm ? (
                <div className="p-6 text-center rounded-xl border-2 border-dashed border-border">
                  <Globe className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-medium text-foreground">No vendor certifications yet</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Upload a certificate above or click Add Certification</p>
                </div>
              ) : vendor.length > 0 && (
                <div className="rounded-xl border border-border overflow-hidden shadow-[var(--shadow-sm)]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="text-[10px] h-8">Certification</TableHead>
                        <TableHead className="text-[10px] h-8 hidden sm:table-cell">Vendor</TableHead>
                        <TableHead className="text-[10px] h-8 hidden md:table-cell">Credential ID</TableHead>
                        <TableHead className="text-[10px] h-8">Expiry</TableHead>
                        <TableHead className="text-[10px] h-8">Shareable</TableHead>
                        <TableHead className="text-[10px] h-8 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendor.map(v => (
                        <TableRow key={v.id} className="text-xs">
                          <TableCell className="font-medium max-w-[130px]">
                            <span className="truncate block">{v.certification_name}</span>
                          </TableCell>
                          <TableCell className="text-muted-foreground hidden sm:table-cell">{v.vendor}</TableCell>
                          <TableCell className="font-mono text-[10px] text-primary/70 hidden md:table-cell">
                            {v.credential_id || "—"}
                          </TableCell>
                          <TableCell>
                            <span className={cn("text-xs", expiryClass(v.expiry_date))}>
                              {v.expiry_date ? fmtDate(v.expiry_date) : "No expiry"}
                              {isExpired(v.expiry_date) && " ⚠"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <button
                              title={v.shareable ? "Shareable — click to disable" : "Not shareable — click to enable"}
                              onClick={async () => {
                                await (supabase.from("vendor_credentials" as any) as any)
                                  .update({ shareable: !v.shareable }).eq("id", v.id);
                                refetchVendor();
                              }}
                              className={cn(
                                "flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded transition-colors",
                                v.shareable
                                  ? "bg-success/15 text-success hover:bg-success/25"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              )}
                            >
                              {v.shareable ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                              {v.shareable ? "On" : "Off"}
                            </button>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-0.5">
                              {v.document_url && (
                                <a href={v.document_url} target="_blank" rel="noreferrer" title="View document">
                                  <button className="p-1.5 rounded hover:bg-primary/10 transition-colors">
                                    <FileText className="w-3.5 h-3.5 text-primary" />
                                  </button>
                                </a>
                              )}
                              <button className="p-1.5 rounded hover:bg-muted transition-colors" title="Edit"
                                onClick={() => { setEditVendor(v); setShowVendorForm(false); setVendorUploadedUrl(null); }}>
                                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                              <button className="p-1.5 rounded hover:bg-destructive/10 transition-colors" title="Delete"
                                onClick={() => deleteVendor(v.id)}>
                                <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ══════════════ SHARING TAB ══════════════ */}
        <TabsContent value="sharing" className="mt-4 space-y-4">
          <Tabs value={sharingSubTab} onValueChange={setSharingSubTab}>
            <TabsList className="h-8">
              <TabsTrigger value="inbox" className="text-xs h-7 gap-1">
                Inbox
                {pendingInbox > 0 && (
                  <Badge variant="destructive" className="text-[9px] h-4 px-1 ml-0.5">{pendingInbox}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent" className="text-xs h-7">Sent</TabsTrigger>
            </TabsList>

            {/* Inbox */}
            <TabsContent value="inbox" className="mt-3 space-y-2">
              {inboxRequests.length === 0 ? (
                <div className="p-8 text-center rounded-xl border-2 border-dashed border-border">
                  <Share2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-muted-foreground">No requests received yet</p>
                </div>
              ) : inboxRequests.map(req => (
                <div
                  key={req.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all",
                    req.status === "pending"
                      ? "border-warning/30 bg-warning/5"
                      : "border-border bg-card"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full border font-medium",
                          STATUS_PILL[req.status] ?? ""
                        )}>
                          {req.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(req.created_at).toLocaleDateString("en-ZA")}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(req.requested_types || []).map(t => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">{t}</span>
                        ))}
                      </div>
                      <p className="text-xs text-foreground italic">"{req.message}"</p>
                      {req.access_expiry && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Access expires: {fmtDate(req.access_expiry)}
                        </p>
                      )}
                    </div>
                    {req.status === "pending" && (
                      <Button size="sm" className="h-8 text-xs gap-1.5 shrink-0"
                        onClick={() => setApproveReq(req)}>
                        <UserCheck className="w-3.5 h-3.5" />
                        Respond
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Sent */}
            <TabsContent value="sent" className="mt-3 space-y-2">
              {sentRequests.length === 0 ? (
                <div className="p-8 text-center rounded-xl border-2 border-dashed border-border">
                  <p className="text-xs text-muted-foreground">No requests sent yet</p>
                </div>
              ) : sentRequests.map(req => (
                <div key={req.id} className="p-4 rounded-xl border border-border bg-card space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", STATUS_PILL[req.status] ?? "")}>
                      {req.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(req.created_at).toLocaleDateString("en-ZA")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(req.requested_types || []).map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">{t}</span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground italic">"{req.message}"</p>
                  {req.status === "approved" && req.access_expiry && (
                    <div className="flex items-center gap-1.5 text-[10px] text-success">
                      <Unlock className="w-3 h-3" />
                      Access granted until {fmtDate(req.access_expiry)}
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ══════════════ NOTIFICATIONS TAB ══════════════ */}
        <TabsContent value="notifications" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</p>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
                Mark all read
              </Button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center rounded-xl border-2 border-dashed border-border">
              <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-xs text-muted-foreground">No notifications yet</p>
            </div>
          ) : notifications.map(n => (
            <div
              key={n.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl border transition-all",
                !n.read_at ? "border-primary/20 bg-primary/5" : "border-border bg-card opacity-75"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                n.type === "request_approved" ? "bg-success/10" :
                n.type === "request_denied" ? "bg-destructive/10" :
                "bg-primary/10"
              )}>
                {n.type === "request_approved" ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> :
                 n.type === "request_denied" ? <XCircle className="w-3.5 h-3.5 text-destructive" /> :
                 <Bell className="w-3.5 h-3.5 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">{n.title}</p>
                {n.body && <p className="text-[11px] text-muted-foreground mt-0.5">{n.body}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(n.created_at).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {!n.read_at && (
                <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
              )}
            </div>
          ))}
        </TabsContent>

        {/* ══════════════ SETTINGS TAB ══════════════ */}
        <TabsContent value="settings" className="mt-4 space-y-4">
          <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-sm)] divide-y divide-border">
            {/* Header */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Credential Sharing Settings</p>
              </div>
              <p className="text-xs text-muted-foreground">Control who can request and view your credential documents</p>
            </div>

            {/* Allow requests toggle */}
            <div className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-medium text-foreground">Allow Credential Requests</Label>
                <p className="text-[11px] text-muted-foreground">Other platform users can request access to your credentials</p>
              </div>
              <Switch
                checked={settingsForm.allow_requests}
                onCheckedChange={v => setSettingsForm(f => ({ ...f, allow_requests: v }))}
              />
            </div>

            {/* Default approval mode */}
            <div className="p-4 space-y-2">
              <Label className="text-xs font-medium text-foreground">Default Approval Mode</Label>
              <Select
                value={settingsForm.default_approval}
                onValueChange={v => setSettingsForm(f => ({ ...f, default_approval: v }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual" className="text-xs">
                    <div className="flex items-center gap-2"><UserCheck className="w-3.5 h-3.5" /> Manual approval</div>
                  </SelectItem>
                  <SelectItem value="auto_all" className="text-xs">
                    <div className="flex items-center gap-2"><Unlock className="w-3.5 h-3.5" /> Auto-approve all</div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Default access duration */}
            <div className="p-4 space-y-2">
              <Label className="text-xs font-medium text-foreground">Default Access Duration</Label>
              <div className="flex items-center gap-2">
                <Input
                  className="h-8 text-xs w-24"
                  type="number"
                  min={1}
                  max={365}
                  value={settingsForm.default_access_days}
                  onChange={e => setSettingsForm(f => ({ ...f, default_access_days: parseInt(e.target.value) || 30 }))}
                />
                <span className="text-xs text-muted-foreground">days</span>
              </div>
            </div>

            {/* Watermark toggle */}
            <div className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-medium text-foreground">Apply Watermark by Default</Label>
                <p className="text-[11px] text-muted-foreground">Shared documents will display viewer info watermark</p>
              </div>
              <Switch
                checked={settingsForm.default_watermark}
                onCheckedChange={v => setSettingsForm(f => ({ ...f, default_watermark: v }))}
              />
            </div>

            {/* Save */}
            <div className="p-4">
              <Button size="sm" className="w-full h-9 gap-1.5" onClick={saveSettings}>
                <CheckCircle2 className="w-4 h-4" />
                Save Settings
              </Button>
            </div>
          </div>

          {/* Credential visibility summary */}
          <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-sm)] p-4 space-y-3">
            <p className="text-xs font-semibold text-foreground flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-primary" />
              Credential Visibility Summary
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Award className="w-3 h-3" /> Accreditations shareable
                </span>
                <span className="font-medium text-foreground tabular-nums">
                  {accreditations.filter(a => a.shareable).length} / {accreditations.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <GraduationCap className="w-3 h-3" /> Qualifications shareable
                </span>
                <span className="font-medium text-foreground tabular-nums">
                  {academic.filter(a => a.shareable).length} / {academic.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Globe className="w-3 h-3" /> Certifications shareable
                </span>
                <span className="font-medium text-foreground tabular-nums">
                  {vendor.filter(v => v.shareable).length} / {vendor.length}
                </span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {approveReq && (
        <ApproveModal
          request={approveReq}
          onClose={() => setApproveReq(null)}
          onRefresh={() => {
            refetchInbox();
            qc.invalidateQueries({ queryKey: ["sharing_requests_sent", user.id] });
          }}
        />
      )}

      {showRequestModal && (
        <RequestModal
          practitionerId={user.id}
          onClose={() => setShowRequestModal(false)}
        />
      )}
    </div>
  );
}
