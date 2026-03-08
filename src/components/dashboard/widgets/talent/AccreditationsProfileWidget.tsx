import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Award, BadgeCheck, Building2, Calendar, BookOpen,
  Hash, ExternalLink, Trash2, Plus, Clock,
  GraduationCap, FileText, Briefcase, Cpu,
  User, ChevronDown, ChevronUp, Sparkles, MapPin,
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

// ─── Config ────────────────────────────────────────────────────────────────────
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

function expiryStatus(valid_to: string | null) {
  if (!valid_to) return null;
  const days = differenceInDays(parseISO(valid_to), new Date());
  if (days < 0)  return { label: "Expired",           cls: "bg-destructive/15 text-destructive",  dot: "bg-destructive" };
  if (days < 60) return { label: `Expires in ${days}d`, cls: "bg-orange-500/15 text-orange-600",  dot: "bg-orange-500" };
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

// ─── Practitioner Card ─────────────────────────────────────────────────────────
function PractitionerCard({ acc, profile }: { acc: Accreditation; profile: Profile }) {
  const cfg = ROLE_CONFIG[acc.role_type?.toLowerCase()] ?? ROLE_CONFIG.assessor;
  const expiry = expiryStatus(acc.valid_to);

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Practitioner";
  const initials = `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? "P"}`.toUpperCase();

  const yearsExp = acc.valid_from
    ? differenceInYears(new Date(), parseISO(acc.valid_from))
    : null;

  // Derive areas of expertise from qualification titles
  const areas = [...new Set(
    (acc.qualifications ?? []).map((q) => {
      const match = q.title.match(/:\s*(.+)$/);
      return match ? match[1].split(":")[0].trim() : q.title.split(":")[0].trim();
    })
  )].slice(0, 8);

  return (
    <div className={`rounded-xl border ${cfg.borderCls} bg-card overflow-hidden`}>
      {/* Coloured top band */}
      <div className={`h-1.5 w-full ${cfg.headerBg}`} />

      <div className="p-5">
        {/* Identity row */}
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
                  <span className={`w-1.5 h-1.5 rounded-full ${expiry.dot}`} />
                  {expiry.label}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badgeCls}`}>{cfg.label}</span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{acc.seta_body}</span>
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <InfoCell icon={Hash} label="Registration No." value={acc.registration_number ?? "—"} highlight />
          <InfoCell icon={Calendar} label="Date Registered"
            value={acc.valid_from ? format(parseISO(acc.valid_from), "dd MMM yyyy") : "—"} />
          <InfoCell icon={Clock} label="Valid Until"
            value={acc.valid_to ? format(parseISO(acc.valid_to), "dd MMM yyyy") : "Indefinite"}
            danger={!!(acc.valid_to && new Date(acc.valid_to) < new Date())} />
          <InfoCell icon={Award} label="Accreditation Status"
            value={expiry?.label ?? "Active"} />
          {yearsExp !== null && (
            <InfoCell icon={User} label="Years of Experience" value={`${yearsExp}+ years`} />
          )}
          {acc.id_number && (
            <InfoCell icon={User} label="ID / Reference" value={acc.id_number} />
          )}
          {profile.location && (
            <InfoCell icon={MapPin} label="Location" value={profile.location} />
          )}
        </div>

        {/* Areas of expertise */}
        {areas.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Areas of Expertise</p>
            <div className="flex flex-wrap gap-1.5">
              {areas.map((area) => (
                <Badge key={area} variant="secondary" className="text-[10px]">{area}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Academic qualifications / bio */}
        {profile.bio && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">About</p>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{profile.bio}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-2.5 border-t border-border bg-muted/20">
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
            <ExternalLink className="w-3 h-3" /> View Original Letter
          </a>
        )}
      </div>
    </div>
  );
}

function InfoCell({
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

// ─── Accreditation Block ───────────────────────────────────────────────────────
function AccreditationBlock({
  acc,
  profile,
  onDelete,
}: {
  acc: Accreditation;
  profile: Profile;
  onDelete: (id: string) => void;
}) {
  const [tableExpanded, setTableExpanded] = useState(true);
  const cfg = ROLE_CONFIG[acc.role_type?.toLowerCase()] ?? ROLE_CONFIG.assessor;
  const Icon = cfg.icon;
  const quals = acc.qualifications ?? [];

  return (
    <div className="space-y-3">
      {/* ── 1. Qualifications Table ──────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Table header */}
        <div
          className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors ${cfg.headerBg}`}
          onClick={() => setTableExpanded(!tableExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}>
              <Icon className={`w-4.5 h-4.5 ${cfg.iconColor}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{cfg.label}</p>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <span className={`flex items-center gap-1 text-xs font-semibold ${cfg.iconColor}`}>
                  <Hash className="w-3 h-3" />
                  {acc.registration_number ?? "No registration number"}
                </span>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="text-xs text-muted-foreground">{acc.seta_body}</span>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="text-xs text-muted-foreground">{quals.length} qualification{quals.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
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
              className="text-muted-foreground hover:text-destructive transition-colors p-1"
              title="Delete accreditation"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            {tableExpanded
              ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
              : <ChevronDown className="w-4 h-4 text-muted-foreground" />
            }
          </div>
        </div>

        {/* The actual qualifications table */}
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
                      {q.nqf_level ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${nqfColour(q.nqf_level)}`}>
                          {q.nqf_level}
                        </span>
                      ) : "—"}
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

        {/* Validity dates footer */}
        {tableExpanded && (acc.valid_from || acc.valid_to) && (
          <div className="flex items-center gap-4 px-4 py-2 border-t border-border bg-muted/20 text-[10px] text-muted-foreground">
            {acc.valid_from && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Valid from: <strong className="text-foreground ml-0.5">{format(parseISO(acc.valid_from), "dd MMM yyyy")}</strong>
              </span>
            )}
            {acc.valid_to && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Valid to: <strong className={`ml-0.5 ${new Date(acc.valid_to) < new Date() ? "text-destructive" : "text-foreground"}`}>
                  {format(parseISO(acc.valid_to), "dd MMM yyyy")}
                </strong>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── 2. Practitioner Card ─────────────────────────────────────────── */}
      <PractitionerCard acc={acc} profile={profile} />
    </div>
  );
}

// ─── Main Widget ───────────────────────────────────────────────────────────────
export function AccreditationsProfileWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showUploader, setShowUploader] = useState(false);

  const { data: profile = {} as Profile } = useQuery<Profile>({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, first_name, last_name, bio, skills, job_title, location, created_at")
        .eq("user_id", user!.id)
        .maybeSingle();
      return (data ?? {}) as Profile;
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
  const active = accreditations.filter((a) => !a.valid_to || new Date(a.valid_to) > new Date()).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Award className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Accreditations &amp; Qualifications</p>
            <p className="text-xs text-muted-foreground">
              {accreditations.length} registration{accreditations.length !== 1 ? "s" : ""} · {totalQuals} qualifications · {active} active
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
          {showUploader ? "Cancel" : "Add Letter"}
        </Button>
      </div>

      {/* Uploader */}
      {showUploader && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <AccreditationUploaderWidget />
        </div>
      )}

      {/* Stats */}
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

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />)}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && accreditations.length === 0 && !showUploader && (
        <div className="text-center py-12 space-y-3">
          <div className="w-14 h-14 rounded-full bg-muted mx-auto flex items-center justify-center">
            <Award className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">No accreditations yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Upload your SETA or professional body registration letter — AI will extract all qualifications automatically
            </p>
          </div>
          <Button size="sm" onClick={() => setShowUploader(true)} className="gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Upload Accreditation Letter
          </Button>
        </div>
      )}

      {/* Accreditation blocks: table → practitioner card */}
      {!isLoading && accreditations.map((acc) => (
        <AccreditationBlock
          key={acc.id}
          acc={acc}
          profile={profile}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      ))}
    </div>
  );
}
