import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Send, Clock, CheckCircle2, XCircle, ChevronRight, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type ApplicationStatus = "pending" | "shortlisted" | "accepted" | "rejected";

interface ApplicationRow {
  id: string;
  status: ApplicationStatus;
  cover_note: string | null;
  created_at: string;
  opportunities: {
    id: string;
    title: string;
    organisation: string | null;
    type: string;
    stipend: string | null;
  } | null;
}

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; icon: React.ElementType; color: string }> = {
  pending:     { label: "Pending",     icon: Clock,         color: "bg-muted text-muted-foreground" },
  shortlisted: { label: "Shortlisted", icon: ChevronRight,  color: "bg-primary/15 text-primary" },
  accepted:    { label: "Accepted",    icon: CheckCircle2,  color: "bg-green-500/15 text-green-600" },
  rejected:    { label: "Rejected",    icon: XCircle,       color: "bg-destructive/10 text-destructive" },
};

type Filter = "all" | ApplicationStatus;

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? "s" : ""} ago`;
}

export function MyApplicationsWidget() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>("all");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-applications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(`id, status, cover_note, created_at, opportunities(id, title, organisation, type, stipend)`)
        .eq("applicant_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ApplicationRow[];
    },
  });

  const withdraw = useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase.from("applications").delete().eq("id", applicationId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-applications"] });
      toast({ title: "Application withdrawn" });
    },
    onError: () => toast({ title: "Failed to withdraw", variant: "destructive" }),
  });

  const apps = data ?? [];
  const filtered = filter === "all" ? apps : apps.filter(a => a.status === filter);
  const counts = {
    pending:     apps.filter(a => a.status === "pending").length,
    shortlisted: apps.filter(a => a.status === "shortlisted").length,
    accepted:    apps.filter(a => a.status === "accepted").length,
    rejected:    apps.filter(a => a.status === "rejected").length,
  };

  if (isLoading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
      <AlertCircle className="w-4 h-4" /> Failed to load applications
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {(Object.entries(counts) as [ApplicationStatus, number][]).map(([status, count]) => {
          const cfg = STATUS_CONFIG[status];
          const Icon = cfg.icon;
          return (
            <button
              key={status}
              onClick={() => setFilter(filter === status ? "all" : status)}
              className={`rounded-xl p-3 border transition-all text-left ${
                filter === status ? "border-primary/40 bg-primary/5" : "border-border bg-card hover:bg-muted/40"
              }`}
            >
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mb-1.5 ${cfg.color}`}>
                <Icon className="w-3 h-3" /> {cfg.label}
              </div>
              <p className="text-xl font-bold text-foreground">{count}</p>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="space-y-2">
        {apps.length === 0 && (
          <div className="text-center py-10 space-y-2">
            <Send className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">You haven't applied to anything yet.</p>
            <p className="text-xs text-muted-foreground">Browse opportunities and hit Apply to get started.</p>
          </div>
        )}
        {filtered.map((app) => {
          const cfg = STATUS_CONFIG[app.status as ApplicationStatus];
          const Icon = cfg.icon;
          return (
            <div key={app.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Send className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{app.opportunities?.title ?? "Unknown"}</p>
                <p className="text-xs text-muted-foreground">
                  {app.opportunities?.organisation} · {timeAgo(app.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {app.opportunities?.stipend && (
                  <span className="text-xs font-medium text-primary hidden sm:block">{app.opportunities.stipend}</span>
                )}
                <Badge variant="outline" className={`gap-1 text-xs border-0 ${cfg.color}`}>
                  <Icon className="w-3 h-3" /> {cfg.label}
                </Badge>
                {app.status === "pending" && (
                  <button
                    onClick={() => withdraw.mutate(app.id)}
                    disabled={withdraw.isPending}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                  >
                    {withdraw.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && apps.length > 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No {filter} applications.
          </div>
        )}
      </div>
    </div>
  );
}
