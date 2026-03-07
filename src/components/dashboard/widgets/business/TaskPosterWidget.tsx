import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  ListTodo, Plus, Save, X, Loader2, Star,
  CheckCircle2, XCircle, Eye, ChevronDown, ChevronUp,
} from "lucide-react";
import type { TablesInsert } from "@/integrations/supabase/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MicroTask {
  id: string;
  title: string;
  category: string | null;
  pay: string | null;
  duration: string | null;
  urgency: string;
  status: string;
  max_workers: number;
  created_at: string;
}

interface Submission {
  id: string;
  worker_id: string;
  status: string;
  timer_seconds: number;
  proof_text: string | null;
  submitted_at: string | null;
}

const CATEGORIES = [
  "Data Entry", "Transcription", "Survey", "Content Moderation",
  "Research", "Virtual Assistance",
];

const BLANK = {
  title: "", category: "Data Entry", description: "",
  pay: "", duration: "", urgency: "Flexible",
  location: "Remote", skills: "", max_workers: "1",
};

const INPUT = "w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring";

// ─── Submission Review Panel ──────────────────────────────────────────────────

function SubmissionReviewer({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [earnings, setEarnings] = useState("");

  const { data: subs = [], isLoading } = useQuery({
    queryKey: ["task-subs-review", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_submissions")
        .select("id,worker_id,status,timer_seconds,proof_text,submitted_at")
        .eq("task_id", taskId)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Submission[];
    },
  });

  const review = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const { error } = await supabase
        .from("task_submissions")
        .update({
          status: approve ? "approved" : "rejected",
          reviewed_at: new Date().toISOString(),
          reviewer_note: note || null,
          earnings: approve && earnings ? parseFloat(earnings) : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, { approve }) => {
      qc.invalidateQueries({ queryKey: ["task-subs-review", taskId] });
      setNote(""); setEarnings("");
      toast({ title: approve ? "Submission approved ✅" : "Submission rejected" });
    },
    onError: (e) => toast({ title: "Review failed", description: String(e), variant: "destructive" }),
  });

  const formatTime = (s: number) => { const m = Math.floor(s / 60); return m > 0 ? `${m}m` : `${s}s`; };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center">
          <X className="w-3.5 h-3.5" />
        </button>
        <p className="text-sm font-bold text-foreground">Review Submissions</p>
      </div>

      {isLoading && <div className="h-20 rounded-xl bg-muted animate-pulse" />}

      {subs.length === 0 && !isLoading && (
        <p className="text-sm text-muted-foreground text-center py-6">No submissions yet.</p>
      )}

      {subs.map(sub => (
        <div key={sub.id} className="rounded-xl border border-border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-foreground">Worker: {sub.worker_id.slice(0, 8)}…</p>
              <p className="text-xs text-muted-foreground">Time: {formatTime(sub.timer_seconds)} · Status: <span className="font-medium">{sub.status}</span></p>
            </div>
            <button
              onClick={() => setExpanded(expanded === sub.id ? null : sub.id)}
              className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground"
            >
              {expanded === sub.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {expanded === sub.id && (
            <div className="space-y-2 pt-2 border-t border-border">
              {sub.proof_text && (
                <div className="p-2 rounded-lg bg-muted/40 text-xs text-foreground leading-relaxed">
                  {sub.proof_text}
                </div>
              )}
              {sub.status === "submitted" && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="Reviewer note (optional)"
                      className={INPUT}
                    />
                    <input
                      value={earnings}
                      onChange={e => setEarnings(e.target.value)}
                      type="number"
                      placeholder="Payout amount (ZAR)"
                      className={INPUT}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => review.mutate({ id: sub.id, approve: true })}
                      disabled={review.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
                    >
                      {review.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      Approve
                    </button>
                    <button
                      onClick={() => review.mutate({ id: sub.id, approve: false })}
                      disabled={review.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 disabled:opacity-50"
                    >
                      <XCircle className="w-3 h-3" /> Reject
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export function TaskPosterWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [reviewingTask, setReviewingTask] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK);

  const { data: myTasks = [], isLoading } = useQuery({
    queryKey: ["my-posted-tasks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("micro_tasks")
        .select("id,title,category,pay,duration,urgency,status,max_workers,created_at")
        .eq("posted_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MicroTask[];
    },
  });

  const post = useMutation({
    mutationFn: async () => {
      const payload: TablesInsert<"micro_tasks"> = {
        posted_by: user!.id,
        title: form.title,
        category: form.category,
        description: form.description || null,
        pay: form.pay || null,
        duration: form.duration || null,
        urgency: form.urgency,
        location: form.location,
        skills: form.skills ? form.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
        status: "available",
      };
      const { error } = await supabase.from("micro_tasks").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-posted-tasks"] });
      qc.invalidateQueries({ queryKey: ["micro-tasks"] });
      setShowForm(false);
      setForm(BLANK);
      toast({ title: "Task posted! 🎉" });
    },
    onError: (e) => toast({ title: "Post failed", description: String(e), variant: "destructive" }),
  });

  const closeTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("micro_tasks").update({ status: "closed" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-posted-tasks"] });
      toast({ title: "Task closed" });
    },
  });

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value })),
  });

  if (reviewingTask) {
    return <SubmissionReviewer taskId={reviewingTask} onClose={() => setReviewingTask(null)} />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-primary" /> Task Poster
          </h3>
          <p className="text-xs text-muted-foreground">{myTasks.filter(t => t.status === "available").length} active tasks</p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setForm(BLANK); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Cancel" : "Post Task"}
        </button>
      </div>

      {/* Post form */}
      {showForm && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">New Micro-Task</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input {...field("title")} placeholder="Task title *" className={INPUT} />
            <select {...field("category")} className={INPUT}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input {...field("pay")} placeholder="Pay (e.g. R50 / hour)" className={INPUT} />
            <input {...field("duration")} placeholder="Duration (e.g. 2 hours)" className={INPUT} />
            <select {...field("urgency")} className={INPUT}>
              <option>Flexible</option>
              <option>This week</option>
              <option>Today</option>
            </select>
            <input {...field("max_workers")} type="number" min="1" placeholder="Max workers" className={INPUT} />
          </div>
          <textarea {...field("description")} placeholder="Task instructions (what should workers do?)…" rows={3} className={`${INPUT} resize-none`} />
          <input {...field("skills")} placeholder="Required skills (comma-separated)" className={INPUT} />
          <button
            onClick={() => post.mutate()}
            disabled={!form.title || post.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
          >
            {post.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Post Task
          </button>
        </div>
      )}

      {/* Task list */}
      {isLoading && (
        <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
      )}

      {!isLoading && myTasks.length === 0 && !showForm && (
        <div className="text-center py-10 space-y-2">
          <ListTodo className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No tasks posted yet. Create your first micro-task!</p>
        </div>
      )}

      <div className="space-y-2">
        {myTasks.map(t => (
          <div key={t.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all group">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-foreground">{t.title}</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  t.status === "available" ? "bg-green-500/10 text-green-600" :
                  t.status === "closed"    ? "bg-muted text-muted-foreground" :
                  "bg-primary/10 text-primary"
                }`}>
                  {t.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t.category} · {t.urgency} {t.pay && `· ${t.pay}`}
              </p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setReviewingTask(t.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all"
              >
                <Eye className="w-3 h-3" /> Review
              </button>
              {t.status === "available" && (
                <button
                  onClick={() => closeTask.mutate(t.id)}
                  disabled={closeTask.isPending}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all"
                >
                  <X className="w-3 h-3" /> Close
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
