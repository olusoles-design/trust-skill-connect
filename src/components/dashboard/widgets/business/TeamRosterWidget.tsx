import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { Search, Users, Loader2, AlertCircle } from "lucide-react";

interface ApplicationRow {
  id: string;
  status: string;
  created_at: string;
  opportunities: {
    id: string;
    title: string;
    type: string;
    duration: string | null;
    stipend: string | null;
  } | null;
}

// Map application status → pipeline-friendly status
function toPhase(status: string): "on_track" | "at_risk" | "completed" | "pending" {
  if (status === "accepted") return "on_track";
  if (status === "shortlisted") return "on_track";
  if (status === "rejected") return "at_risk";
  if (status === "pending") return "pending";
  return "pending";
}

const statusConfig = {
  on_track:  { label: "On Track",  color: "bg-green-500/15 text-green-600" },
  at_risk:   { label: "At Risk",   color: "bg-destructive/10 text-destructive" },
  completed: { label: "Completed", color: "bg-primary/15 text-primary" },
  pending:   { label: "Pending",   color: "bg-muted text-muted-foreground" },
};

export function TeamRosterWidget() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  // Fetch applications on opportunities posted by this user
  const { data: applications = [], isLoading, error } = useQuery({
    queryKey: ["employer-learners", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, status, created_at, opportunities!inner(id, title, type, duration, stipend)")
        .eq("opportunities.posted_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ApplicationRow[];
    },
  });

  const filtered = applications.filter(a =>
    (a.opportunities?.title ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const summary = {
    total:     applications.length,
    on_track:  applications.filter(a => toPhase(a.status) === "on_track").length,
    at_risk:   applications.filter(a => toPhase(a.status) === "at_risk").length,
    completed: applications.filter(a => toPhase(a.status) === "completed").length,
  };

  if (isLoading) return (
    <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}</div>
  );
  if (error) return (
    <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
      <AlertCircle className="w-4 h-4" /> Failed to load learner roster
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl bg-muted/40 border border-border p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{summary.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{summary.on_track}</p>
          <p className="text-xs text-green-600/70">Active</p>
        </div>
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-center">
          <p className="text-2xl font-bold text-destructive">{summary.at_risk}</p>
          <p className="text-xs text-destructive/70">At Risk</p>
        </div>
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-center">
          <p className="text-2xl font-bold text-primary">{summary.completed}</p>
          <p className="text-xs text-primary/70">Completed</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by programme..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-10 space-y-2">
          <Users className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No applicants on your programmes yet.</p>
          <p className="text-xs text-muted-foreground">Post an opportunity to start receiving applications.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Applicant ID</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Programme</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Progress</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Stipend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(app => {
                  const phase = toPhase(app.status);
                  const cfg = statusConfig[phase];
                  // Use a deterministic progress value based on status
                  const progress = phase === "completed" ? 100 : phase === "on_track" ? 65 : phase === "at_risk" ? 30 : 5;
                  return (
                    <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                            {app.id.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground text-xs">{app.id.slice(0, 8)}…</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                        {app.opportunities?.title ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Progress value={progress} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground w-8">{progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-primary text-right hidden sm:table-cell">
                        {app.opportunities?.stipend ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
