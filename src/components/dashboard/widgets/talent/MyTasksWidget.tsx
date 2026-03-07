import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Wallet, CheckCircle2, Clock, XCircle, AlertTriangle,
  Star, TrendingUp, Loader2,
} from "lucide-react";

interface SubmissionRow {
  id: string;
  task_id: string;
  status: string;
  timer_seconds: number;
  earnings: number | null;
  quality_score: number | null;
  reviewer_note: string | null;
  submitted_at: string | null;
  created_at: string;
  micro_tasks: {
    title: string;
    category: string | null;
    pay: string | null;
    employer: string | null;
  } | null;
}

const STATUS_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  in_progress: { label: "In Progress",  color: "text-primary",                       icon: Clock },
  submitted:   { label: "Under Review", color: "text-yellow-600 dark:text-yellow-400", icon: Clock },
  approved:    { label: "Approved",     color: "text-green-600",                     icon: CheckCircle2 },
  rejected:    { label: "Rejected",     color: "text-destructive",                   icon: XCircle },
  disputed:    { label: "Disputed",     color: "text-orange-500",                    icon: AlertTriangle },
};

function formatTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function StarRow({ score }: { score: number | null }) {
  if (!score) return null;
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`w-3 h-3 ${s <= score ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />
      ))}
    </div>
  );
}

export function MyTasksWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"active" | "history">("active");

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["my-tasks-full", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_submissions")
        .select("id,task_id,status,timer_seconds,earnings,quality_score,reviewer_note,submitted_at,created_at, micro_tasks(title,category,pay,employer)")
        .eq("worker_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SubmissionRow[];
    },
  });

  const raiseDispute = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("task_submissions")
        .update({ status: "disputed" })
        .eq("id", id)
        .eq("worker_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-tasks-full"] });
      toast({ title: "Dispute raised", description: "A moderator will review your submission." });
    },
  });

  const active  = submissions.filter(s => s.status === "in_progress" || s.status === "submitted");
  const history = submissions.filter(s => s.status === "approved" || s.status === "rejected" || s.status === "disputed");

  const totalEarned  = history.filter(s => s.status === "approved").reduce((sum, s) => sum + (s.earnings ?? 0), 0);
  const totalTime    = submissions.reduce((sum, s) => sum + s.timer_seconds, 0);
  const avgScore     = history.filter(s => s.quality_score).reduce((sum, s, _, a) => sum + (s.quality_score ?? 0) / a.length, 0);

  const displayed = tab === "active" ? active : history;

  if (isLoading) return (
    <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Total Earned",  value: `R${totalEarned.toFixed(0)}`, color: "text-green-600", icon: Wallet },
          { label: "Time Worked",   value: formatTime(totalTime),         color: "text-primary",   icon: Clock },
          { label: "Avg Quality",   value: avgScore > 0 ? avgScore.toFixed(1) + "★" : "—", color: "text-yellow-600 dark:text-yellow-400", icon: TrendingUp },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-xl bg-muted/40 border border-border text-center">
            <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted/40 border border-border">
        {(["active", "history"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
              tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "active" ? `Active (${active.length})` : `History (${history.length})`}
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div className="text-center py-10 space-y-2">
          <Wallet className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            {tab === "active" ? "No active tasks. Start one from the Task Board!" : "Complete tasks to build your history."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map(s => {
            const meta  = STATUS_META[s.status] ?? STATUS_META.in_progress;
            const Icon  = meta.icon;
            const task  = s.micro_tasks;

            return (
              <div key={s.id} className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{task?.title ?? "Task"}</p>
                    <p className="text-xs text-muted-foreground">{task?.employer}</p>
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-semibold ${meta.color}`}>
                    <Icon className="w-3.5 h-3.5" />{meta.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(s.timer_seconds)} logged</span>
                  {task?.category && <span className="capitalize">{task.category}</span>}
                  {s.earnings && <span className="font-semibold text-green-600">R{s.earnings.toFixed(2)} earned</span>}
                  {task?.pay && !s.earnings && <span>{task.pay}</span>}
                </div>

                {s.quality_score && (
                  <div className="flex items-center gap-2">
                    <StarRow score={s.quality_score} />
                    {s.reviewer_note && <p className="text-xs text-muted-foreground italic">"{s.reviewer_note}"</p>}
                  </div>
                )}

                {s.status === "rejected" && (
                  <button
                    onClick={() => raiseDispute.mutate(s.id)}
                    disabled={raiseDispute.isPending}
                    className="flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-600 font-medium"
                  >
                    {raiseDispute.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />}
                    Raise a dispute
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
