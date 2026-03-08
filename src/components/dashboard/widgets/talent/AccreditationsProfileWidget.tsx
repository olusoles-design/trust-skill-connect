import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Award, BadgeCheck, Building2, Calendar, BookOpen,
  Hash, ExternalLink, Trash2, Plus, Clock,
  GraduationCap, FileText, Briefcase, Cpu,
  User, ChevronDown, ChevronUp, Sparkles, MapPin,
  Upload, Lock, CheckCircle2, XCircle, AlertTriangle,
  FolderOpen, Shield, Pencil,
} from "lucide-react";
import { differenceInDays, differenceInYears, parseISO, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { AccreditationUploaderWidget } from "./AccreditationUploaderWidget";
import { useState, useRef } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Qualification {
  id: string;
  accreditation_id: string;
  user_id: string;
  saqa_id: string | null;
  title: string;
  nqf_level: string | null;
  credits: number | null;
  created_at: string;
}

interface Accreditation {
  id: string;
  user_id: string;
  seta_body: string;
  role_type: string;
  registration_number: string | null;
  id_number: string | null;
  valid_from: string | null;
  valid_to: string | null;
  status: string;
  document_url: string | null;
  created_at: string;
  qualifications?: Qualification[];
}

interface Profile {
  avatar_url?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  bio?: string | null;
  skills?: string[] | null;
  created_at?: string;
  job_title?: string | null;
  location?: string | null;
}

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
  mime_type: string | null;
}

// ─── Config ─────────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  headerBg: string;
  iconBg: string;
  iconColor: string;
  badgeCls: string;
  borderCls: string;
}> = {
  assessor:       { label: "Registered Assessor",      icon: FileText,      headerBg: "bg-blue-500/10",    iconBg: "bg-blue-500/15",    iconColor: "text-blue-600",    badgeCls: "bg-blue-500/15 text-blue-700",    borderCls: "border-blue-500/20" },
  facilitator:    { label: "Registered Facilitator",   icon: GraduationCap, headerBg: "bg-primary/10",     iconBg: "bg-primary/15",     iconColor: "text-primary",     badgeCls: "bg-primary/15 text-primary",      borderCls: "border-primary/20" },
  moderator:      { label: "Registered Moderator",     icon: Briefcase,     headerBg: "bg-purple-500/10",  iconBg: "bg-purple-500/15",  iconColor: "text-purple-600",  badgeCls: "bg-purple-500/15 text-purple-700",borderCls: "border-purple-500/20" },
  sdf:            { label: "Skills Dev. Facilitator",  icon: Cpu,           headerBg: "bg-orange-500/10",  iconBg: "bg-orange-500/15",  iconColor: "text-orange-600",  badgeCls: "bg-orange-500/15 text-orange-700",borderCls: "border-orange-500/20" },
  verifier:       { label: "Verifier",                 icon: BadgeCheck,    headerBg: "bg-emerald-500/10", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-600", badgeCls: "bg-emerald-500/15 text-emerald-700",borderCls: "border-emerald-500/20" },
  etqa_evaluator: { label: "ETQA Evaluator",           icon: Award,         headerBg: "bg-muted",          iconBg: "bg-muted",          iconColor: "text-muted-foreground",badgeCls: "bg-muted text-muted-foreground",  borderCls: "border-border" },
};

const SETA_BODIES = [
  "AgriSETA", "BANKSETA", "CATHSSETA", "CETA", "CHIETA", "EWSETA",
  "ETDP SETA", "FASSET", "FoodBev SETA", "HWSETA", "INSETA", "LGSETA",
  "MICT SETA", "MQA", "MERSETA", "POSHEITA", "PSETA", "SASSETA",
  "SERVICES SETA", "TETA", "W&RSETA",
];

const ROLE_TYPES = [
  { value: "assessor",       label: "Registered Assessor" },
  { value: "facilitator",    label: "Registered Facilitator" },
  { value: "moderator",      label: "Registered Moderator" },
  { value: "sdf",            label: "Skills Development Facilitator" },
  { value: "verifier",       label: "Verifier" },
  { value: "etqa_evaluator", label: "ETQA Evaluator" },
];

const NQF_LEVELS = ["Level 1","Level 2","Level 3","Level 4","Level 5","Level 6","Level 7","Level 8","Level 9","Level 10"];

const DOC_SECTIONS = [
  { key: "cv",            label: "Curriculum Vitae (CV)",      icon: User,       accept: ".pdf,.doc,.docx",       hint: "Upload your latest CV" },
  { key: "certification", label: "Certifications",             icon: Award,      accept: ".pdf,.jpg,.jpeg,.png",  hint: "Certificates, diplomas & qualifications" },
  { key: "other",         label: "Other Documents",            icon: FolderOpen, accept: ".pdf,.jpg,.jpeg,.png,.doc,.docx", hint: "Any other relevant compliance documents" },
];

const STATUS_CONFIG: Record<DocStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pending:  { label: "Pending Review", icon: Clock,         color: "text-yellow-600",  bg: "bg-yellow-500/10 border-yellow-500/20" },
  verified: { label: "Verified",       icon: CheckCircle2,  color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/20" },
  rejected: { label: "Rejected",       icon: XCircle,       color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
  expired:  { label: "Expired",        icon: AlertTriangle, color: "text-orange-600",  bg: "bg-orange-500/10 border-orange-500/20" },
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function expiryStatus(valid_to: string | null) {
  if (!valid_to) return null;
  const days = differenceInDays(parseISO(valid_to), new Date());
  if (days < 0)  return { label: "Expired",            cls: "bg-destructive/15 text-destructive",   dot: "bg-destructive" };
  if (days < 60) return { label: `Expires in ${days}d`, cls: "bg-orange-500/15 text-orange-600",   dot: "bg-orange-500" };
  return            { label: "Active",                 cls: "bg-emerald-500/15 text-emerald-700",  dot: "bg-emerald-500" };
}

function nqfColour(level: string | null): string {
  if (!level) return "bg-muted text-muted-foreground";
  const num = parseInt(level.replace(/\D/g, ""), 10);
  if (num >= 7) return "bg-purple-500/15 text-purple-700";
  if (num >= 5) return "bg-blue-500/15 text-blue-700";
  if (num >= 4) return "bg-primary/15 text-primary";
  return "bg-muted text-muted-foreground";
}

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// ─── InfoCell ───────────────────────────────────────────────────────────────
function InfoCell({ icon: Icon, label, value, highlight = false, danger = false }:
  { icon: React.ElementType; label: string; value: string; highlight?: boolean; danger?: boolean }) {
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40">
      <Icon className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${highlight ? "text-primary" : danger ? "text-destructive" : "text-muted-foreground"}`} />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className={`text-xs font-semibold truncate ${danger ? "text-destructive" : highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
      </div>
    </div>
  );
}

// ─── Practitioner Card ──────────────────────────────────────────────────────
function PractitionerCard({ acc, profile }: { acc: Accreditation; profile: Profile }) {
  const cfg = ROLE_CONFIG[acc.role_type?.toLowerCase()] ?? ROLE_CONFIG.assessor;
  const expiry = expiryStatus(acc.valid_to);
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Practitioner";
  const initials = `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? "P"}`.toUpperCase();
  const yearsExp = acc.valid_from ? differenceInYears(new Date(), parseISO(acc.valid_from)) : null;
  const areas = [...new Set((acc.qualifications ?? []).map((q) => {
    const match = q.title.match(/:\s*(.+)$/);
    return match ? match[1].split(":")[0].trim() : q.title.split(":")[0].trim();
  }))].slice(0, 8);

  return (
    <div className={`rounded-xl border ${cfg.borderCls} bg-card overflow-hidden`}>
      <div className={`h-1.5 w-full ${cfg.headerBg}`} />
      <div className="p-5">
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="w-16 h-16 border-2 border-border flex-shrink-0">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className={`text-lg font-bold ${cfg.iconBg} ${cfg.iconColor}`}>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p className="text-base font-bold text-foreground">{fullName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{profile.job_title || cfg.label}</p>
              </div>
              {expiry && (
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${expiry.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${expiry.dot}`} />{expiry.label}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badgeCls}`}>{cfg.label}</span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{acc.seta_body}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <InfoCell icon={Hash} label="Registration No." value={acc.registration_number ?? "—"} highlight />
          <InfoCell icon={Calendar} label="Date Registered" value={acc.valid_from ? format(parseISO(acc.valid_from), "dd MMM yyyy") : "—"} />
          <InfoCell icon={Clock} label="Valid Until" value={acc.valid_to ? format(parseISO(acc.valid_to), "dd MMM yyyy") : "Indefinite"} danger={!!(acc.valid_to && new Date(acc.valid_to) < new Date())} />
          <InfoCell icon={Award} label="Status" value={expiry?.label ?? "Active"} />
          {yearsExp !== null && <InfoCell icon={User} label="Years of Experience" value={`${yearsExp}+ years`} />}
          {acc.id_number && <InfoCell icon={User} label="ID / Reference" value={acc.id_number} />}
          {profile.location && <InfoCell icon={MapPin} label="Location" value={profile.location} />}
        </div>
        {areas.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Areas of Expertise</p>
            <div className="flex flex-wrap gap-1.5">
              {areas.map((area) => <Badge key={area} variant="secondary" className="text-[10px]">{area}</Badge>)}
            </div>
          </div>
        )}
        {profile.bio && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">About</p>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{profile.bio}</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-5 py-2.5 border-t border-border bg-muted/20">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Building2 className="w-3 h-3" /><span>Registered with {acc.seta_body}</span>
        </div>
        {acc.document_url && (
          <a href={acc.document_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary flex items-center gap-1 hover:underline font-medium">
            <ExternalLink className="w-3 h-3" /> View Original Letter
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Manual Accreditation Row Form ──────────────────────────────────────────
function ManualEntryRow({ onAdd }: { onAdd: (q: Omit<Qualification, "id" | "accreditation_id" | "user_id" | "created_at">) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ saqa_id: "", title: "", nqf_level: "", credits: "" });

  function submit() {
    if (!form.title) return;
    onAdd({ saqa_id: form.saqa_id || null, title: form.title, nqf_level: form.nqf_level || null, credits: form.credits ? parseInt(form.credits) : null });
    setForm({ saqa_id: "", title: "", nqf_level: "", credits: "" });
    setOpen(false);
  }

  return (
    <>
      <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => setOpen(true)}>
        <Plus className="w-3 h-3" /> Add Qualification
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Qualification Manually</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">SAQA ID</Label>
                <Input placeholder="e.g. 71869" value={form.saqa_id} onChange={(e) => setForm((p) => ({ ...p, saqa_id: e.target.value }))} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Credits</Label>
                <Input type="number" placeholder="e.g. 120" value={form.credits} onChange={(e) => setForm((p) => ({ ...p, credits: e.target.value }))} className="h-8 text-xs" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Qualification Title *</Label>
              <Textarea placeholder="Full qualification title as on the certificate" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="text-xs min-h-[60px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">NQF Level</Label>
              <Select value={form.nqf_level} onValueChange={(v) => setForm((p) => ({ ...p, nqf_level: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select NQF level…" /></SelectTrigger>
                <SelectContent>{NQF_LEVELS.map((l) => <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={submit} disabled={!form.title}>Add Qualification</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Manual Accreditation Registration Form ─────────────────────────────────
function AddAccreditationForm({ userId, onSaved }: { userId: string; onSaved: () => void }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [qualifications, setQualifications] = useState<Array<Omit<Qualification, "id" | "accreditation_id" | "user_id" | "created_at">>>([]);
  const [form, setForm] = useState({
    seta_body: "",
    role_type: "",
    registration_number: "",
    valid_from: "",
    valid_to: "",
  });

  async function handleSave() {
    if (!form.seta_body || !form.role_type) {
      toast({ title: "Required fields missing", description: "SETA Body and Role Type are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data: acc, error: accErr } = await (supabase.from("practitioner_accreditations" as any) as any)
        .insert({
          user_id: userId,
          seta_body: form.seta_body,
          role_type: form.role_type,
          registration_number: form.registration_number || null,
          valid_from: form.valid_from || null,
          valid_to: form.valid_to || null,
          status: "active",
        })
        .select("id")
        .single();
      if (accErr) throw accErr;

      if (qualifications.length > 0) {
        const quals = qualifications.map((q) => ({ ...q, accreditation_id: acc.id, user_id: userId }));
        const { error: qualErr } = await (supabase.from("accreditation_qualifications" as any) as any).insert(quals);
        if (qualErr) throw qualErr;
      }
      toast({ title: "Accreditation saved!", description: `${qualifications.length} qualifications recorded.` });
      onSaved();
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
      <p className="text-xs font-semibold text-foreground flex items-center gap-2"><Pencil className="w-3.5 h-3.5 text-primary" />Manual Registration Entry</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">SETA Body *</Label>
          <Select value={form.seta_body} onValueChange={(v) => setForm((p) => ({ ...p, seta_body: v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select SETA…" /></SelectTrigger>
            <SelectContent className="max-h-48">{SETA_BODIES.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Role Type *</Label>
          <Select value={form.role_type} onValueChange={(v) => setForm((p) => ({ ...p, role_type: v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select role…" /></SelectTrigger>
            <SelectContent>{ROLE_TYPES.map((r) => <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1 col-span-2">
          <Label className="text-xs">Registration Number</Label>
          <Input placeholder="e.g. RAS/07/2018/0051" value={form.registration_number} onChange={(e) => setForm((p) => ({ ...p, registration_number: e.target.value }))} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Valid From</Label>
          <Input type="date" value={form.valid_from} onChange={(e) => setForm((p) => ({ ...p, valid_from: e.target.value }))} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Valid To</Label>
          <Input type="date" value={form.valid_to} onChange={(e) => setForm((p) => ({ ...p, valid_to: e.target.value }))} className="h-8 text-xs" />
        </div>
      </div>

      {/* Qualifications mini-table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Qualifications ({qualifications.length})</p>
          <ManualEntryRow onAdd={(q) => setQualifications((p) => [...p, q])} />
        </div>
        {qualifications.length > 0 && (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-7 text-[10px] w-20">SAQA ID</TableHead>
                  <TableHead className="h-7 text-[10px]">Title</TableHead>
                  <TableHead className="h-7 text-[10px] w-20 text-center">NQF</TableHead>
                  <TableHead className="h-7 text-[10px] w-14 text-right">Credits</TableHead>
                  <TableHead className="h-7 w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {qualifications.map((q, i) => (
                  <TableRow key={i}>
                    <TableCell className="py-1.5 text-[11px] font-mono text-muted-foreground">{q.saqa_id ?? "—"}</TableCell>
                    <TableCell className="py-1.5 text-xs text-foreground leading-snug">{q.title}</TableCell>
                    <TableCell className="py-1.5 text-center">
                      {q.nqf_level ? <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${nqfColour(q.nqf_level)}`}>{q.nqf_level}</span> : "—"}
                    </TableCell>
                    <TableCell className="py-1.5 text-xs text-right">{q.credits ?? "—"}</TableCell>
                    <TableCell className="py-1.5">
                      <button onClick={() => setQualifications((p) => p.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1 gap-1.5">
          {saving ? <span className="w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Save Registration
        </Button>
      </div>
    </div>
  );
}

// ─── Accreditation Block ────────────────────────────────────────────────────
function AccreditationBlock({ acc, profile, onDelete }: { acc: Accreditation; profile: Profile; onDelete: (id: string) => void }) {
  const [tableExpanded, setTableExpanded] = useState(true);
  const cfg = ROLE_CONFIG[acc.role_type?.toLowerCase()] ?? ROLE_CONFIG.assessor;
  const Icon = cfg.icon;
  const quals = acc.qualifications ?? [];

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors ${cfg.headerBg}`} onClick={() => setTableExpanded(!tableExpanded)}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}>
              <Icon className={`w-4.5 h-4.5 ${cfg.iconColor}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{cfg.label}</p>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <span className={`flex items-center gap-1 text-xs font-semibold ${cfg.iconColor}`}><Hash className="w-3 h-3" />{acc.registration_number ?? "No reg. number"}</span>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="text-xs text-muted-foreground">{acc.seta_body}</span>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="text-xs text-muted-foreground">{quals.length} qualification{quals.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {acc.document_url && (
              <a href={acc.document_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[10px] text-primary flex items-center gap-1 hover:underline">
                <ExternalLink className="w-3 h-3" /> Letter
              </a>
            )}
            <button onClick={(e) => { e.stopPropagation(); onDelete(acc.id); }} className="text-muted-foreground hover:text-destructive transition-colors p-1" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            {tableExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>

        {tableExpanded && quals.length > 0 && (
          <div className="border-t border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-8 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-20">SAQA ID</TableHead>
                  <TableHead className="h-8 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Title of Qualification</TableHead>
                  <TableHead className="h-8 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-24 text-center">NQF Level</TableHead>
                  <TableHead className="h-8 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-16 text-right">Credits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quals.map((q, i) => (
                  <TableRow key={q.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/10"}>
                    <TableCell className="py-2.5 text-xs font-mono text-muted-foreground">{q.saqa_id ?? "—"}</TableCell>
                    <TableCell className="py-2.5 text-xs font-medium text-foreground leading-snug">{q.title}</TableCell>
                    <TableCell className="py-2.5 text-center">
                      {q.nqf_level ? <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${nqfColour(q.nqf_level)}`}>{q.nqf_level}</span> : "—"}
                    </TableCell>
                    <TableCell className="py-2.5 text-xs text-right font-semibold text-foreground">{q.credits ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {tableExpanded && quals.length === 0 && (
          <div className="border-t border-border px-4 py-8 text-center">
            <BookOpen className="w-5 h-5 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No qualifications recorded for this registration</p>
          </div>
        )}

        {tableExpanded && (acc.valid_from || acc.valid_to) && (
          <div className="flex items-center gap-4 px-4 py-2 border-t border-border bg-muted/20 text-[10px] text-muted-foreground">
            {acc.valid_from && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Valid from: <strong className="text-foreground ml-0.5">{format(parseISO(acc.valid_from), "dd MMM yyyy")}</strong></span>}
            {acc.valid_to && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Valid to: <strong className={`ml-0.5 ${new Date(acc.valid_to) < new Date() ? "text-destructive" : "text-foreground"}`}>{format(parseISO(acc.valid_to), "dd MMM yyyy")}</strong></span>}
          </div>
        )}
      </div>
      <PractitionerCard acc={acc} profile={profile} />
    </div>
  );
}

// ─── Document Section ────────────────────────────────────────────────────────
function DocumentSection({ sectionKey, label, icon: Icon, accept, hint, docs, onUpload, onDelete, uploading }: {
  sectionKey: string;
  label: string;
  icon: React.ElementType;
  accept: string;
  hint: string;
  docs: VaultDoc[];
  onUpload: (file: File, docType: string, docLabel: string, expiresAt: string) => void;
  onDelete: (id: string) => void;
  uploading: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: "", expires_at: "", file: null as File | null });

  const sectionDocs = docs.filter((d) => d.doc_type === sectionKey || (sectionKey === "other" && !["cv", "certification"].includes(d.doc_type)));

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{sectionDocs.length}</Badge>
          <button
            onClick={(e) => { e.stopPropagation(); setShowForm(!showForm); setExpanded(true); }}
            className="text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border">
          {/* Upload form */}
          {showForm && (
            <div className="p-4 bg-muted/30 border-b border-border space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Label / Description</Label>
                  <Input placeholder={`e.g. My ${label}`} value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />Expiry Date (optional)</Label>
                  <Input type="date" value={form.expires_at} onChange={(e) => setForm((p) => ({ ...p, expires_at: e.target.value }))} className="h-8 text-xs" />
                </div>
              </div>
              <div
                className="border-2 border-dashed border-border rounded-lg p-3 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept={accept} className="hidden"
                  onChange={(e) => setForm((p) => ({ ...p, file: e.target.files?.[0] ?? null }))} />
                {form.file
                  ? <p className="text-xs text-primary font-medium">{form.file.name} ({formatSize(form.file.size)})</p>
                  : <><Upload className="w-4 h-4 mx-auto text-muted-foreground mb-1" /><p className="text-xs text-muted-foreground">{accept.replace(/\./g, "").toUpperCase()} — max 20MB</p></>
                }
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 h-8 text-xs gap-1.5" disabled={!form.file || uploading}
                  onClick={() => { if (form.file) { onUpload(form.file, sectionKey, form.label || label, form.expires_at); setForm({ label: "", expires_at: "", file: null }); setShowForm(false); } }}>
                  {uploading ? <span className="w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Upload className="w-3 h-3" />}
                  Upload
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Documents */}
          {sectionDocs.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <Icon className="w-6 h-6 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">No {label.toLowerCase()} uploaded yet</p>
              <Button size="sm" variant="ghost" className="mt-2 text-xs gap-1 h-7" onClick={() => setShowForm(true)}>
                <Plus className="w-3 h-3" /> Upload now
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sectionDocs.map((doc) => {
                const cfg = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.pending;
                const StatusIcon = cfg.icon;
                return (
                  <div key={doc.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-medium text-foreground">{doc.label}</p>
                        <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>
                          <StatusIcon className="w-2.5 h-2.5" />{cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{doc.file_name}{doc.file_size ? ` · ${formatSize(doc.file_size)}` : ""}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Added {format(parseISO(doc.created_at), "dd MMM yyyy")}</p>
                      {doc.expires_at && (() => {
                        const days = differenceInDays(parseISO(doc.expires_at), new Date());
                        return (
                          <p className={`text-[10px] mt-0.5 ${days < 0 ? "text-destructive" : days < 30 ? "text-orange-600" : "text-muted-foreground"}`}>
                            {days < 0 ? `Expired ${Math.abs(days)}d ago` : `Expires ${format(parseISO(doc.expires_at), "dd MMM yyyy")}`}
                          </p>
                        );
                      })()}
                      {doc.reviewer_note && <p className="text-[10px] text-muted-foreground italic mt-0.5">"{doc.reviewer_note}"</p>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" variant="ghost" className="h-6 w-6"><ExternalLink className="w-3 h-3" /></Button>
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
        </div>
      )}
    </div>
  );
}

// ─── Main Widget ─────────────────────────────────────────────────────────────
export function AccreditationsProfileWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showUploader, setShowUploader] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [docUploading, setDocUploading] = useState(false);

  const { data: profile = {} as Profile } = useQuery<Profile>({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("avatar_url, first_name, last_name, bio, skills, job_title, location, created_at").eq("user_id", user!.id).maybeSingle();
      return (data ?? {}) as Profile;
    },
  });

  const { data: accreditations = [], isLoading: loadingAccreds } = useQuery<Accreditation[]>({
    queryKey: ["practitioner_accreditations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: accs, error: accErr } = await (supabase.from("practitioner_accreditations" as any) as any).select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (accErr) throw accErr;
      const { data: quals, error: qualErr } = await (supabase.from("accreditation_qualifications" as any) as any).select("*").eq("user_id", user!.id);
      if (qualErr) throw qualErr;
      return ((accs ?? []) as Accreditation[]).map((acc: Accreditation) => ({
        ...acc,
        qualifications: ((quals ?? []) as Qualification[]).filter((q: Qualification) => q.accreditation_id === acc.id),
      }));
    },
  });

  const { data: docs = [], isLoading: loadingDocs } = useQuery<VaultDoc[]>({
    queryKey: ["document_vault", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase.from("document_vault" as any) as any).select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown) as VaultDoc[];
    },
  });

  const deleteAccredMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("practitioner_accreditations" as any) as any).delete().eq("id", id).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["practitioner_accreditations", user?.id] });
      toast({ title: "Accreditation removed" });
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("document_vault" as any) as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["document_vault", user?.id] }),
  });

  async function handleDocUpload(file: File, docType: string, label: string, expiresAt: string) {
    if (!user) return;
    setDocUploading(true);
    try {
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error: storageErr } = await supabase.storage.from("documents").upload(path, file, { upsert: false });
      if (storageErr) throw storageErr;
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
      const { error: dbErr } = await (supabase.from("document_vault" as any) as any).insert({
        user_id: user.id, doc_type: docType, label, file_url: urlData.publicUrl,
        file_name: file.name, file_size: file.size, mime_type: file.type,
        expires_at: expiresAt || null, status: "pending",
      });
      if (dbErr) throw dbErr;
      toast({ title: "Document uploaded", description: "Pending verification" });
      queryClient.invalidateQueries({ queryKey: ["document_vault", user.id] });
    } catch (err) {
      toast({ title: "Upload failed", description: String(err), variant: "destructive" });
    } finally {
      setDocUploading(false);
    }
  }

  if (!user) return null;

  const totalQuals = accreditations.reduce((sum, a) => sum + (a.qualifications?.length ?? 0), 0);
  const activeAccreds = accreditations.filter((a) => !a.valid_to || new Date(a.valid_to) > new Date()).length;
  const verifiedDocs = docs.filter((d) => d.status === "verified").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Award className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Practitioner Profile</p>
            <p className="text-xs text-muted-foreground">{accreditations.length} registrations · {totalQuals} qualifications · {verifiedDocs} verified docs</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="courses" className="gap-1.5 text-xs">
            <GraduationCap className="w-3.5 h-3.5" />
            Accredited Courses
            {accreditations.length > 0 && <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">{accreditations.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5 text-xs">
            <FolderOpen className="w-3.5 h-3.5" />
            Documents
            {docs.length > 0 && <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">{docs.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Accredited Courses ──────────────────────────────────────── */}
        <TabsContent value="courses" className="mt-4 space-y-4">
          {/* Stats bar */}
          {accreditations.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xl font-bold text-foreground">{accreditations.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Registrations</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xl font-bold text-foreground">{totalQuals}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Qualifications</p>
              </div>
              <div className="rounded-lg bg-emerald-500/10 p-3 text-center">
                <p className="text-xl font-bold text-emerald-700">{activeAccreds}</p>
                <p className="text-[10px] text-emerald-700/70 uppercase tracking-wide">Active</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={showUploader ? "secondary" : "default"}
              onClick={() => { setShowUploader(!showUploader); setShowManualForm(false); }}
              className="flex-1 gap-1.5 text-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {showUploader ? "Close" : "Upload SETA Letter (AI)"}
            </Button>
            <Button
              size="sm"
              variant={showManualForm ? "secondary" : "outline"}
              onClick={() => { setShowManualForm(!showManualForm); setShowUploader(false); }}
              className="flex-1 gap-1.5 text-xs"
            >
              <Pencil className="w-3.5 h-3.5" />
              {showManualForm ? "Close" : "Add Manually"}
            </Button>
          </div>

          {/* AI Uploader */}
          {showUploader && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-semibold text-foreground flex items-center gap-2 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                AI Accreditation Extractor
              </p>
              <AccreditationUploaderWidget />
            </div>
          )}

          {/* Manual form */}
          {showManualForm && (
            <AddAccreditationForm
              userId={user.id}
              onSaved={() => {
                setShowManualForm(false);
                queryClient.invalidateQueries({ queryKey: ["practitioner_accreditations", user.id] });
              }}
            />
          )}

          {/* Loading */}
          {loadingAccreds && (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />)}
            </div>
          )}

          {/* Empty */}
          {!loadingAccreds && accreditations.length === 0 && !showUploader && !showManualForm && (
            <div className="text-center py-12 space-y-3">
              <div className="w-14 h-14 rounded-full bg-muted mx-auto flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">No accreditations yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  Upload your SETA letter for AI extraction, or add registrations manually
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button size="sm" onClick={() => setShowUploader(true)} className="gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Upload Letter
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowManualForm(true)} className="gap-1.5">
                  <Pencil className="w-3.5 h-3.5" /> Add Manually
                </Button>
              </div>
            </div>
          )}

          {/* Accreditation blocks */}
          {!loadingAccreds && accreditations.map((acc) => (
            <AccreditationBlock key={acc.id} acc={acc} profile={profile} onDelete={(id) => deleteAccredMutation.mutate(id)} />
          ))}
        </TabsContent>

        {/* ── Tab 2: Documents ───────────────────────────────────────────────── */}
        <TabsContent value="documents" className="mt-4 space-y-4">
          {/* Trust bar */}
          {docs.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-foreground">Document Trust Score</p>
                  <span className={`text-sm font-bold ${verifiedDocs / Math.max(docs.length, 1) >= 0.8 ? "text-emerald-600" : verifiedDocs > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                    {Math.round((verifiedDocs / Math.max(docs.length, 1)) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.round((verifiedDocs / Math.max(docs.length, 1)) * 100)}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{verifiedDocs} of {docs.length} documents verified</p>
              </div>
            </div>
          )}

          {/* Document sections */}
          {loadingDocs ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>
          ) : (
            <div className="space-y-3">
              {DOC_SECTIONS.map((section) => (
                <DocumentSection
                  key={section.key}
                  sectionKey={section.key}
                  label={section.label}
                  icon={section.icon}
                  accept={section.accept}
                  hint={section.hint}
                  docs={docs}
                  onUpload={handleDocUpload}
                  onDelete={(id) => deleteDocMutation.mutate(id)}
                  uploading={docUploading}
                />
              ))}
            </div>
          )}

          {/* Notice */}
          <div className="flex items-start gap-2 p-3 bg-muted/20 rounded-lg border border-border/50 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
            <span>Your profile is only visible to Sponsors and Employers once at least one document is <strong className="text-foreground">Verified</strong>.</span>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
