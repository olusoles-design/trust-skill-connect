import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Award, BadgeCheck, Building2, Calendar, BookOpen,
  Hash, ExternalLink, Trash2, Plus, Clock,
  GraduationCap, FileText, Briefcase, Cpu, MapPin,
  User, Star, ChevronDown, ChevronUp, Sparkles,
} from "lucide-react";
import { differenceInDays, differenceInYears, parseISO, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { AccreditationUploaderWidget } from "./AccreditationUploaderWidget";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

// ─── Config ────────────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; bg: string; color: string; badge: string }> = {
  assessor:       { label: "Registered Assessor",       icon: FileText,      bg: "bg-blue-500/10",    color: "text-blue-600",    badge: "bg-blue-500/15 text-blue-700" },
  facilitator:    { label: "Registered Facilitator",    icon: GraduationCap, bg: "bg-primary/10",     color: "text-primary",     badge: "bg-primary/15 text-primary" },
  moderator:      { label: "Registered Moderator",      icon: Briefcase,     bg: "bg-purple-500/10",  color: "text-purple-600",  badge: "bg-purple-500/15 text-purple-700" },
  sdf:            { label: "Skills Dev. Facilitator",   icon: Cpu,           bg: "bg-orange-500/10",  color: "text-orange-600",  badge: "bg-orange-500/15 text-orange-700" },
  verifier:       { label: "Verifier",                  icon: BadgeCheck,    bg: "bg-emerald-500/10", color: "text-emerald-600", badge: "bg-emerald-500/15 text-emerald-700" },
  etqa_evaluator: { label: "ETQA Evaluator",            icon: Award,         bg: "bg-secondary/10",   color: "text-secondary-foreground", badge: "bg-muted text-muted-foreground" },
};

function expiryStatus(valid_to: string | null) {
  if (!valid_to) return null;
  const days = differenceInDays(parseISO(valid_to), new Date());
  if (days < 0)  return { label: "Expired",           cls: "bg-destructive/15 text-destructive",    dot: "bg-destructive" };
  if (days < 60) return { label: `Exp. in ${days}d`,  cls: "bg-orange-500/15 text-orange-600",      dot: "bg-orange-500" };
  return            { label: "Active",                 cls: "bg-emerald-500/15 text-emerald-700",    dot: "bg-emerald-500" };
}

// ─── NQF Level colour helper ───────────────────────────────────────────────────
function nqfColour(level: string | null) {
  if (!level) return "bg-muted text-muted-foreground";
  const num = parseInt(level.replace(/\D/g, ""), 10);
  if (num >= 7) return "bg-purple-500/15 text-purple-700";
  if (num >= 5) return "bg-blue-500/15 text-blue-700";
  if (num >= 4) return "bg-primary/15 text-primary";
  return "bg-muted text-muted-foreground";
}

// ─── Practitioner Profile Card ────────────────────────────────────────────────
function PractitionerCard({
  acc,
  profile,
}: {
  acc: Accreditation;
  profile: { avatar_url?: string | null; first_name?: string | null; last_name?: string | null; bio?: string | null; skills?: string[] | null; created_at?: string; job_title?: string | null; location?: string | null };
}) {
  const cfg = ROLE_CONFIG[acc.role_type] ?? ROLE_CONFIG.assessor;
  const Icon = cfg.icon;
  const expiry = expiryStatus(acc.valid_to);

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || acc.registration_number || "Practitioner";
  const initials = `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? "P"}`.toUpperCase();

  // Years of experience: from earliest registration date
  const yearsExp = acc.valid_from
    ? differenceInYears(new Date(), parseISO(acc.valid_from))
    : null;

  // Areas of expertise: unique qualification titles trimmed
  const areas = [...new Set(
    (acc.qualifications ?? []).map((q) => {
      // Extract domain from qualification title
      const t = q.title;
      const match = t.match(/:\s*(.+)$/);
      return match ? match[1].split(":")[0].trim() : t.split(":")[0].trim();
    })
  )].slice(0, 6);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header gradient band */}
      <div className={`h-2 w-full bg-gradient-to-r ${cfg.color.replace("text-", "from-")} to-primary/30`} />

      <div className="p-5 space-y-5">
        {/* Top row: avatar + name + status */}
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16 border-2 border-border flex-shrink-0">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className={`text-lg font-bold ${cfg.bg} ${cfg.color}`}>{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p className="text-base font-bold text-foreground leading-tight">{fullName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{profile.job_title || cfg.label}</p>
              </div>
              {expiry && (
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${expiry.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${expiry.dot}`} />
                  {expiry.label}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{acc.seta_body}</span>
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3">
          <InfoPill
            icon={Hash}
            label="Registration No."
            value={acc.registration_number ?? "—"}
            highlight
          />
          <InfoPill
            icon={Calendar}
            label="Date Registered"
            value={acc.valid_from ? format(parseISO(acc.valid_from), "dd MMM yyyy") : "—"}
          />
          <InfoPill
            icon={Clock}
            label="Valid Until"
            value={acc.valid_to ? format(parseISO(acc.valid_to), "dd MMM yyyy") : "Indefinite"}
            danger={!!(acc.valid_to && new Date(acc.valid_to) < new Date())}
          />
          <InfoPill
            icon={Star}
            label="Years of Experience"
            value={yearsExp !== null ? `${yearsExp}+ years` : "—"}
          />
          {acc.id_number && (
            <InfoPill
              icon={User}
              label="ID / Reference"
              value={acc.id_number}
            />
          )}
          {profile.location && (
            <InfoPill
              icon={MapPin}
              label="Location"
              value={profile.location}
            />
          )}
        </div>

        {/* Areas of expertise */}
        {areas.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Areas of Expertise</p>
            <div className="flex flex-wrap gap-1.5">
              {areas.map((area) => (
                <Badge key={area} variant="secondary" className="text-[10px] font-medium px-2">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Bio / Academic qualification */}
        {profile.bio && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">About</p>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{profile.bio}</p>
          </div>
        )}

        {profile.skills && profile.skills.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Skills</p>
            <div className="flex flex-wrap gap-1">
              {profile.skills.slice(0, 8).map((s) => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Building2 className="w-3 h-3" />
          <span>Registered with {acc.seta_body}</span>
        </div>
        {acc.document_url && (
          <a
            href={acc.document_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-primary flex items-center gap-1 hover:underline font-medium"
          >
            <ExternalLink className="w-3 h-3" /> View Letter
          </a>
        )}
      </div>
    </div>
  );
}

function InfoPill({
  icon: Icon,
  label,
  value,
  highlight = false,
  danger = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
  danger?: boolean;
}) {
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

// ─── Qualifications Table ──────────────────────────────────────────────────────
function QualificationsTable({
  acc,
  onDelete,
}: {
  acc: Accreditation;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const cfg = ROLE_CONFIG[acc.role_type] ?? ROLE_CONFIG.assessor;
  const Icon = cfg.icon;
  const quals = acc.qualifications ?? [];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
            <Icon className={`w-4.5 h-4.5 ${cfg.color}`} />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{cfg.label}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Hash className="w-3 h-3" /> {acc.registration_number ?? "No reg. number"}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{acc.seta_body}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{quals.length} qualifications</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {acc.document_url && (
            <a
              href={acc.document_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] text-primary flex items-center gap-1 hover:underline"
            >
              <ExternalLink className="w-3 h-3" /> Letter
            </a>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(acc.id); }}
            className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Qualifications table */}
      {expanded && quals.length > 0 && (
        <div className="border-t border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="h-8 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-20">SAQA ID</TableHead>
                <TableHead className="h-8 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Qualification Title</TableHead>
                <TableHead className="h-8 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-20 text-center">Level</TableHead>
                <TableHead className="h-8 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-16 text-right">Credits</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quals.map((q, i) => (
                <TableRow key={q.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/10"}>
                  <TableCell className="py-2 text-xs text-muted-foreground font-mono">{q.saqa_id ?? "—"}</TableCell>
                  <TableCell className="py-2 text-xs font-medium text-foreground leading-snug">{q.title}</TableCell>
                  <TableCell className="py-2 text-center">
                    {q.nqf_level ? (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${nqfColour(q.nqf_level)}`}>
                        {q.nqf_level}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="py-2 text-xs text-right font-medium text-foreground">{q.credits ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {expanded && quals.length === 0 && (
        <div className="border-t border-border px-4 py-6 text-center">
          <BookOpen className="w-5 h-5 text-muted-foreground/40 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">No qualifications recorded for this registration</p>
        </div>
      )}

      {/* Footer dates */}
      {expanded && (
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border bg-muted/10 text-[10px] text-muted-foreground">
          {acc.valid_from && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              From: <strong className="text-foreground ml-0.5">{format(parseISO(acc.valid_from), "dd MMM yyyy")}</strong>
            </span>
          )}
          {acc.valid_to && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              To: <strong className={`ml-0.5 ${new Date(acc.valid_to) < new Date() ? "text-destructive" : "text-foreground"}`}>
                {format(parseISO(acc.valid_to), "dd MMM yyyy")}
              </strong>
            </span>
          )}
          <span className="ml-auto">Added {format(parseISO(acc.created_at), "dd MMM yyyy")}</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Widget ───────────────────────────────────────────────────────────────
export function AccreditationsProfileWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showUploader, setShowUploader] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, first_name, last_name, bio, skills, job_title, location, created_at")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: accreditations = [], isLoading } = useQuery<Accreditation[]>({
    queryKey: ["practitioner_accreditations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: accs, error: accErr } = await (supabase.from("practitioner_accreditations" as any) as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (accErr) throw accErr;

      const { data: quals, error: qualErr } = await (supabase.from("accreditation_qualifications" as any) as any)
        .select("*")
        .eq("user_id", user!.id);
      if (qualErr) throw qualErr;

      return ((accs ?? []) as Accreditation[]).map((acc: Accreditation) => ({
        ...acc,
        qualifications: ((quals ?? []) as Qualification[]).filter((q: Qualification) => q.accreditation_id === acc.id),
      }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("practitioner_accreditations" as any) as any)
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["practitioner_accreditations", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["credential_wallet", user?.id] });
      toast({ title: "Accreditation removed" });
    },
    onError: (e) => toast({ title: "Error", description: String(e), variant: "destructive" }),
  });

  if (!user) return null;

  const totalQuals = accreditations.reduce((sum, a) => sum + (a.qualifications?.length ?? 0), 0);
  const active = accreditations.filter((a) => a.status === "active" && (!a.valid_to || new Date(a.valid_to) > new Date())).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Award className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Accreditations & Qualifications</p>
            <p className="text-xs text-muted-foreground">
              {accreditations.length} registrations · {totalQuals} qualifications · {active} active
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant={showUploader ? "secondary" : "default"}
          onClick={() => setShowUploader(!showUploader)}
          className="gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          {showUploader ? "Cancel" : "Add New"}
        </Button>
      </div>

      {/* Uploader */}
      {showUploader && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <AccreditationUploaderWidget />
        </div>
      )}

      {/* Summary stats */}
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
            <p className="text-xl font-bold text-emerald-700">{active}</p>
            <p className="text-[10px] text-emerald-700/70 uppercase tracking-wide">Active</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && accreditations.length === 0 && !showUploader && (
        <div className="text-center py-10 space-y-3">
          <div className="w-14 h-14 rounded-full bg-muted mx-auto flex items-center justify-center">
            <Award className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">No accreditations yet</p>
            <p className="text-xs text-muted-foreground mt-1">Upload your SETA or professional body letters to get started</p>
          </div>
          <Button size="sm" onClick={() => setShowUploader(true)} className="gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Upload Accreditation Letter
          </Button>
        </div>
      )}

      {/* Per-accreditation: table then practitioner card */}
      {!isLoading && accreditations.map((acc) => (
        <div key={acc.id} className="space-y-3">
          {/* 1. Qualifications table with registration number */}
          <QualificationsTable
            acc={acc}
            onDelete={(id) => deleteMutation.mutate(id)}
          />

          {/* 2. Practitioner profile card */}
          <PractitionerCard acc={acc} profile={profile ?? {}} />
        </div>
      ))}
    </div>
  );
}
