import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Award, BadgeCheck, Building2, Calendar, BookOpen,
  ChevronRight, Hash, ExternalLink, Trash2, Plus, Clock,
  GraduationCap, FileText, Briefcase, Cpu,
} from "lucide-react";
import { differenceInDays, parseISO, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AccreditationUploaderWidget } from "./AccreditationUploaderWidget";
import { useState } from "react";

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
const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; bg: string; color: string }> = {
  assessor:       { label: "Registered Assessor",           icon: FileText,      bg: "bg-blue-500/10",    color: "text-blue-600" },
  facilitator:    { label: "Registered Facilitator",        icon: GraduationCap, bg: "bg-primary/10",     color: "text-primary" },
  moderator:      { label: "Registered Moderator",          icon: Briefcase,     bg: "bg-purple-500/10",  color: "text-purple-600" },
  sdf:            { label: "Skills Dev. Facilitator",       icon: Cpu,           bg: "bg-orange-500/10",  color: "text-orange-600" },
  verifier:       { label: "Verifier",                      icon: BadgeCheck,    bg: "bg-emerald-500/10", color: "text-emerald-600" },
  etqa_evaluator: { label: "ETQA Evaluator",                icon: Award,         bg: "bg-secondary/10",   color: "text-secondary-foreground" },
};

function expiryStatus(valid_to: string | null) {
  if (!valid_to) return null;
  const days = differenceInDays(parseISO(valid_to), new Date());
  if (days < 0)  return { label: "Expired",        cls: "bg-destructive/15 text-destructive" };
  if (days < 60) return { label: `Exp. in ${days}d`, cls: "bg-orange-500/15 text-orange-600" };
  return { label: format(parseISO(valid_to), "dd MMM yyyy"), cls: "bg-muted text-muted-foreground" };
}

// ─── Accreditation Card ────────────────────────────────────────────────────────
function AccreditationCard({
  acc,
  onDelete,
}: {
  acc: Accreditation;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = ROLE_CONFIG[acc.role_type] ?? ROLE_CONFIG.assessor;
  const Icon = cfg.icon;
  const expiry = expiryStatus(acc.valid_to);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Card header */}
      <div
        className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
            <Icon className={`w-5 h-5 ${cfg.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p className="text-sm font-bold text-foreground">{cfg.label}</p>
                <p className="text-xs text-muted-foreground font-medium">{acc.seta_body}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {expiry && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${expiry.cls}`}>
                    {expiry.label}
                  </span>
                )}
                {acc.status === "active" && !expiry && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700">Active</span>
                )}
                <BadgeCheck className={`w-4 h-4 ${cfg.color}`} />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
              {acc.registration_number && (
                <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{acc.registration_number}</span>
              )}
              {acc.valid_from && (
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
                  {acc.valid_from}{acc.valid_to ? ` → ${acc.valid_to}` : ""}
                </span>
              )}
              {acc.qualifications && (
                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{acc.qualifications.length} qualifications</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded qualifications */}
      {expanded && acc.qualifications && acc.qualifications.length > 0 && (
        <div className="border-t border-border bg-muted/20 p-3 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Registered Qualifications</p>
          {acc.qualifications.map((q) => (
            <div key={q.id} className="flex items-start gap-2 p-2 rounded-lg bg-card border border-border/50">
              <ChevronRight className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground leading-snug">{q.title}</p>
                <div className="flex gap-2 mt-0.5 flex-wrap">
                  {q.saqa_id && <span className="text-[10px] text-muted-foreground">SAQA {q.saqa_id}</span>}
                  {q.nqf_level && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{q.nqf_level}</span>}
                  {q.credits && <span className="text-[10px] text-muted-foreground">{q.credits} credits</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/10">
        <span className="text-[10px] text-muted-foreground">
          Added {format(parseISO(acc.created_at), "dd MMM yyyy")}
        </span>
        <div className="flex gap-2">
          {acc.document_url && (
            <a href={acc.document_url} target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-primary flex items-center gap-1 hover:underline">
              <ExternalLink className="w-3 h-3" /> View letter
            </a>
          )}
          <button
            onClick={() => onDelete(acc.id)}
            className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Widget ───────────────────────────────────────────────────────────────
export function AccreditationsProfileWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showUploader, setShowUploader] = useState(false);

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

      {/* Uploader (expandable) */}
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
          {[1, 2].map((i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
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
            <Plus className="w-3.5 h-3.5" /> Upload Accreditation Letter
          </Button>
        </div>
      )}

      {/* Accreditation cards */}
      {!isLoading && accreditations.length > 0 && (
        <div className="space-y-3">
          {accreditations.map((acc) => (
            <AccreditationCard
              key={acc.id}
              acc={acc}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
