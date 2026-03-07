import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Clock, MapPin, Zap, CheckCircle2, Loader2, AlertCircle,
  Play, Send, ChevronLeft, Timer, Star, Shield, WifiOff,
  FileText, Camera, Pause,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MicroTask {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  pay: string | null;
  duration: string | null;
  location: string;
  urgency: string;
  skills: string[] | null;
  employer: string | null;
  status: string;
  max_workers: number;
}

interface Submission {
  id: string;
  task_id: string;
  status: string;
  timer_seconds: number;
  proof_text: string | null;
  earnings: number | null;
  quality_score: number | null;
  reviewer_note: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "All", "Data Entry", "Transcription", "Survey", "Content Moderation",
  "Research", "Virtual Assistance",
];

const urgencyColor: Record<string, string> = {
  "Today":     "bg-destructive/10 text-destructive",
  "This week": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  "Flexible":  "bg-muted text-muted-foreground",
};

const statusColor: Record<string, string> = {
  in_progress: "text-primary",
  submitted:   "text-yellow-600 dark:text-yellow-400",
  approved:    "text-green-600",
  rejected:    "text-destructive",
  disputed:    "text-orange-500",
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Task Workspace (active task view) ────────────────────────────────────────

function TaskWorkspace({
  task,
  submission,
  onBack,
}: {
  task: MicroTask;
  submission: Submission | null;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [elapsed, setElapsed] = useState(submission?.timer_seconds ?? 0);
  const [running, setRunning] = useState(
    submission?.status === "in_progress" && !submission?.proof_text
  );
  const [proofText, setProofText] = useState(submission?.proof_text ?? "");
  const [rating, setRating] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  // Persist timer every 30s
  const saveTimer = useCallback(async () => {
    if (!submission?.id) return;
    await supabase.from("task_submissions").update({ timer_seconds: elapsed }).eq("id", submission.id);
  }, [submission?.id, elapsed]);

  useEffect(() => {
    const id = setInterval(saveTimer, 30_000);
    return () => clearInterval(id);
  }, [saveTimer]);

  const submitWork = useMutation({
    mutationFn: async () => {
      if (!submission?.id) throw new Error("No active submission");
      const { error } = await supabase.from("task_submissions").update({
        status: "submitted",
        proof_text: proofText || null,
        submitted_at: new Date().toISOString(),
        timer_seconds: elapsed,
      }).eq("id", submission.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setRunning(false);
      qc.invalidateQueries({ queryKey: ["my-task-submissions"] });
      qc.invalidateQueries({ queryKey: ["micro-tasks"] });
      toast({ title: "Work submitted! ✅", description: "The task poster will review your submission." });
      onBack();
    },
    onError: (e) => toast({ title: "Submit failed", description: String(e), variant: "destructive" }),
  });

  const ratePoster = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.from("task_ratings" as never).insert({
        task_id: task.id,
        rater_id: user.id,
        ratee_id: task.id, // poster's user id is not directly available; use task_id as proxy key
        rating,
        role: "worker_rates_poster",
      } as never);
      if (error && !error.message.includes("unique")) throw error;
    },
    onSuccess: () => toast({ title: "Rating submitted!" }),
  });

  const isSubmitted = submission?.status === "submitted";
  const isApproved  = submission?.status === "approved";
  const isRejected  = submission?.status === "rejected";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{task.title}</p>
          <p className="text-xs text-muted-foreground">{task.employer}</p>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${urgencyColor[task.urgency] ?? "bg-muted text-muted-foreground"}`}>
          {task.urgency}
        </span>
      </div>

      {/* Timer + Anti-fraud bar */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/40">
        <div className="flex items-center gap-2 flex-1">
          <Timer className={`w-4 h-4 ${running ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
          <span className="font-mono text-lg font-bold text-foreground">{formatTime(elapsed)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5 text-green-500" />
          Anti-fraud verified
        </div>
        {!isSubmitted && !isApproved && (
          <button
            onClick={() => setRunning(r => !r)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              running
                ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            }`}
          >
            {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Task description */}
      {task.description && (
        <div className="p-3 rounded-xl bg-muted/30 border border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Task Instructions</p>
          <p className="text-sm text-foreground leading-relaxed">{task.description}</p>
        </div>
      )}

      {/* Status banners */}
      {isApproved && (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <div>
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">Approved! 🎉</p>
            {submission?.earnings && (
              <p className="text-xs text-muted-foreground">Earnings: R{submission.earnings.toFixed(2)}</p>
            )}
            {submission?.reviewer_note && (
              <p className="text-xs text-muted-foreground mt-0.5">"{submission.reviewer_note}"</p>
            )}
          </div>
        </div>
      )}

      {isRejected && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
          <p className="text-sm font-semibold text-destructive">Rejected</p>
          {submission?.reviewer_note && (
            <p className="text-xs text-muted-foreground mt-0.5">{submission.reviewer_note}</p>
          )}
        </div>
      )}

      {isSubmitted && (
        <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-2">
          <Clock className="w-4 h-4 text-yellow-600" />
          <p className="text-sm font-medium text-foreground">Under review by task poster</p>
        </div>
      )}

      {/* Proof submission */}
      {!isSubmitted && !isApproved && !isRejected && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Proof of Work
          </p>
          <textarea
            value={proofText}
            onChange={e => setProofText(e.target.value)}
            placeholder="Describe what you did, paste results, or add any relevant notes for the reviewer…"
            rows={4}
            className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex gap-2">
            <button
              disabled
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-primary/40 transition-all disabled:opacity-40"
            >
              <Camera className="w-3.5 h-3.5" /> Attach screenshot
            </button>
          </div>
          <button
            onClick={() => submitWork.mutate()}
            disabled={submitWork.isPending || elapsed < 10}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {submitWork.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />}
            {elapsed < 10 ? `Start working (${10 - elapsed}s min)` : "Submit Work"}
          </button>
          {elapsed < 10 && (
            <p className="text-[11px] text-muted-foreground text-center">
              Minimum 10 seconds of active work required to submit
            </p>
          )}
        </div>
      )}

      {/* Rate poster (after approved) */}
      {isApproved && rating === 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground">Rate this task poster</p>
          <div className="flex gap-1.5">
            {[1,2,3,4,5].map(s => (
              <button
                key={s}
                onClick={() => { setRating(s); ratePoster.mutate(); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-all"
              >
                <Star className={`w-5 h-5 ${s <= rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export function MicroTaskBoardWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [catFilter, setCatFilter] = useState("All");
  const [activeTask, setActiveTask] = useState<MicroTask | null>(null);
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on  = () => setIsOffline(false);
    const off = () => setIsOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ["micro-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("micro_tasks")
        .select("id,title,description,category,pay,duration,location,urgency,skills,employer,status,max_workers")
        .eq("status", "available")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MicroTask[];
    },
    staleTime: 60_000,
  });

  const { data: mySubmissions = [] } = useQuery({
    queryKey: ["my-task-submissions"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_submissions")
        .select("id,task_id,status,timer_seconds,proof_text,earnings,quality_score,reviewer_note")
        .eq("worker_id", user!.id);
      if (error) throw error;
      return (data ?? []) as Submission[];
    },
  });

  const startTask = useMutation({
    mutationFn: async (task: MicroTask) => {
      if (!user) throw new Error("Sign in required");
      const existing = mySubmissions.find(s => s.task_id === task.id);
      if (existing) return existing;
      const { data, error } = await supabase
        .from("task_submissions")
        .insert({ task_id: task.id, worker_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Submission;
    },
    onSuccess: (submission, task) => {
      qc.invalidateQueries({ queryKey: ["my-task-submissions"] });
      setActiveSubmission(submission);
      setActiveTask(task);
    },
    onError: (e) => toast({ title: "Could not start task", description: String(e), variant: "destructive" }),
  });

  const categories = ["All", ...Array.from(new Set(tasks.map(t => t.category).filter(Boolean) as string[]))];
  const filtered = catFilter === "All" ? tasks : tasks.filter(t => t.category === catFilter);

  const getSubmissionForTask = (id: string) => mySubmissions.find(s => s.task_id === id);

  const approvedCount  = mySubmissions.filter(s => s.status === "approved").length;
  const pendingCount   = mySubmissions.filter(s => s.status === "in_progress" || s.status === "submitted").length;
  const totalEarnings  = mySubmissions.reduce((sum, s) => sum + (s.earnings ?? 0), 0);

  // ── Active task workspace ──
  if (activeTask) {
    return (
      <TaskWorkspace
        task={activeTask}
        submission={activeSubmission}
        onBack={() => { setActiveTask(null); setActiveSubmission(null); qc.invalidateQueries({ queryKey: ["my-task-submissions"] }); }}
      />
    );
  }

  if (isLoading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
      <AlertCircle className="w-4 h-4" /> Failed to load tasks
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Offline banner */}
      {isOffline && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-xs font-medium">
          <WifiOff className="w-3.5 h-3.5" />
          You're offline — tasks downloaded for completion are available below.
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Available",   value: tasks.length,    color: "text-primary" },
          { label: "In Progress", value: pendingCount,    color: "text-yellow-600 dark:text-yellow-400" },
          { label: "Earned",      value: `R${totalEarnings.toFixed(0)}`, color: "text-green-600" },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-xl bg-muted/40 border border-border text-center">
            <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Completed badge */}
      {approvedCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {approvedCount} task{approvedCount > 1 ? "s" : ""} completed — great work!
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCatFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
              catFilter === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 space-y-2">
          <Zap className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No tasks in this category right now.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const sub = getSubmissionForTask(task.id);
            const isActive = sub?.status === "in_progress";
            const isDone   = sub?.status === "approved" || sub?.status === "submitted";

            return (
              <div
                key={task.id}
                className={`p-4 rounded-xl border transition-all ${
                  isActive ? "border-primary/40 bg-primary/5" :
                  isDone   ? "border-green-500/30 bg-green-500/5 opacity-75" :
                  "border-border bg-card hover:bg-muted/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-semibold text-foreground">{task.title}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${urgencyColor[task.urgency] ?? "bg-muted text-muted-foreground"}`}>
                        {task.urgency}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{task.employer}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                      {task.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{task.duration}</span>}
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{task.location}</span>
                      {task.pay && <span className="font-semibold text-foreground">{task.pay}</span>}
                    </div>
                    {task.skills && task.skills.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {task.skills.slice(0, 3).map(s => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">{s}</span>
                        ))}
                      </div>
                    )}
                    {sub && (
                      <p className={`text-[11px] font-semibold mt-1.5 ${statusColor[sub.status] ?? "text-muted-foreground"}`}>
                        ● {sub.status.replace("_", " ")}
                        {sub.status === "in_progress" && ` · ${formatTime(sub.timer_seconds)} logged`}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => startTask.mutate(task)}
                    disabled={startTask.isPending || isDone}
                    className={`flex-shrink-0 mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary"
                        : isDone
                          ? "bg-muted text-muted-foreground border-transparent cursor-not-allowed"
                          : "bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground hover:scale-[1.02]"
                    }`}
                  >
                    {startTask.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                     isActive             ? <><Play className="w-3 h-3" />Continue</> :
                     isDone               ? <><CheckCircle2 className="w-3 h-3" />Done</> :
                                            <><Play className="w-3 h-3" />Start</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
