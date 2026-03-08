import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, AlertTriangle, UserCheck, MapPin, Filter, Loader2, AlertCircle, Users } from "lucide-react";

interface ApplicationRow {
  id: string;
  status: string;
  created_at: string;
  opportunities: {
    id: string;
    title: string;
    type: string;
    location: string | null;
    nqf_level_required: string | null;
    seta: string | null;
    organisation: string | null;
  } | null;
}

type Phase = "registered" | "active" | "assessment" | "completed" | "at_risk";

function toPhase(status: string): Phase {
  if (status === "accepted")    return "active";
  if (status === "shortlisted") return "assessment";
  if (status === "rejected")    return "at_risk";
  return "registered";
}

const PHASES: Record<Phase, { label: string; icon: React.ElementType; color: string; dot: string }> = {
  registered: { label: "Registered",  icon: UserCheck,     color: "bg-muted text-muted-foreground",         dot: "bg-muted-foreground" },
  active:     { label: "Active",      icon: Clock,         color: "bg-primary/15 text-primary",             dot: "bg-primary" },
  assessment: { label: "Assessment",  icon: CheckCircle2,  color: "bg-yellow-500/15 text-yellow-600",       dot: "bg-yellow-500" },
  completed:  { label: "Completed",   icon: CheckCircle2,  color: "bg-emerald-500/15 text-emerald-600",     dot: "bg-emerald-500" },
  at_risk:    { label: "At Risk",     icon: AlertTriangle, color: "bg-destructive/10 text-destructive",     dot: "bg-destructive" },
};

export function LearnerPipelineWidget() {
  const { user } = useAuth();
  const [locationFilter, setLocationFilter] = useState("All");

  const { data: applications = [], isLoading, error } = useQuery({
    queryKey: ["learner-pipeline", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, status, created_at, opportunities!inner(id, title, type, location, nqf_level_required, seta, organisation)")
        .eq("opportunities.posted_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ApplicationRow[];
    },
  });

  const locations = ["All", ...Array.from(new Set(
    applications.map(a => a.opportunities?.location ?? "Unknown").filter(Boolean)
  ))];

  const filtered = applications.filter(a =>
    locationFilter === "All" || a.opportunities?.location === locationFilter
  );

  const stats = {
    total:     applications.length,
    active:    applications.filter(a => toPhase(a.status) === "active").length,
    at_risk:   applications.filter(a => toPhase(a.status) === "at_risk").length,
    completed: applications.filter(a => toPhase(a.status) === "completed").length,
  };

  if (isLoading) return (
    <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}</div>
  );
  if (error) return (
    <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
      <AlertCircle className="w-4 h-4" /> Failed to load pipeline
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Pipeline KPIs */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Total",     val: stats.total,     cls: "bg-muted/40 border-border text-foreground" },
          { label: "Active",    val: stats.active,    cls: "bg-primary/10 border-primary/20 text-primary" },
          { label: "At Risk",   val: stats.at_risk,   cls: "bg-destructive/10 border-destructive/20 text-destructive" },
          { label: "Completed", val: stats.completed, cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border p-2.5 text-center ${k.cls}`}>
            <p className="text-lg font-black">{k.val}</p>
            <p className="text-[10px] opacity-70">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Location filter */}
      {locations.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          {locations.map(loc => (
            <button
              key={loc}
              onClick={() => setLocationFilter(loc)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
                locationFilter === loc
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      )}

      {applications.length === 0 ? (
        <div className="text-center py-10 space-y-2">
          <Users className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No learners in pipeline yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(app => {
            const phase = toPhase(app.status);
            const ph = PHASES[phase];
            const Icon = ph.icon;
            const progress = phase === "completed" ? 100 : phase === "active" ? 65 : phase === "assessment" ? 85 : phase === "at_risk" ? 30 : 5;
            return (
              <div key={app.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                  {app.id.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-foreground truncate">{app.opportunities?.title ?? "Programme"}</p>
                    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${ph.color}`}>
                      <Icon className="w-2.5 h-2.5" />{ph.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                    {app.opportunities?.organisation && <span>{app.opportunities.organisation}</span>}
                    {app.opportunities?.location && (
                      <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{app.opportunities.location}</span>
                    )}
                    {app.opportunities?.nqf_level_required && <span>NQF {app.opportunities.nqf_level_required}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={progress} className="h-1 flex-1" />
                    <span className="text-[10px] text-muted-foreground w-8">{progress}%</span>
                  </div>
                </div>
                <div className="text-right text-[10px] text-muted-foreground flex-shrink-0">
                  {app.opportunities?.seta && <p>{app.opportunities.seta}</p>}
                  <p>{new Date(app.created_at).toLocaleDateString("en-ZA", { month: "short", year: "numeric" })}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
