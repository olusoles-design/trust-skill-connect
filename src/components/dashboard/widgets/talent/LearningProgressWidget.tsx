import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, BookOpen, Calendar, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Programme {
  id: string;
  title: string;
  provider: string;
  nqf_level: number;
  progress_pct: number;
  modules_completed: number;
  total_modules: number;
  due_date: string | null;
  status: "active" | "completed" | "paused";
}

const statusColor: Record<Programme["status"], string> = {
  active:    "bg-primary/15 text-primary",
  completed: "bg-green-500/15 text-green-600",
  paused:    "bg-muted text-muted-foreground",
};

export function LearningProgressWidget() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("learner_programmes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setProgrammes(data.map((r: any) => ({
          id: r.id,
          title: r.title,
          provider: r.provider,
          nqf_level: r.nqf_level,
          progress_pct: r.progress_pct,
          modules_completed: r.modules_completed,
          total_modules: r.total_modules,
          due_date: r.due_date,
          status: r.status as Programme["status"],
        })));
      }
      setLoading(false);
    }
    fetch();
  }, []);

  const activeProgrammes = programmes.filter(p => p.status !== "completed");
  const completed = programmes.filter(p => p.status === "completed").length;
  const avgProgress = programmes.length
    ? Math.round(programmes.reduce((s, p) => s + p.progress_pct, 0) / programmes.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-muted/50 border border-border p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{activeProgrammes.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Active</p>
        </div>
        <div className="rounded-xl bg-muted/50 border border-border p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{completed}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
        </div>
        <div className="rounded-xl bg-muted/50 border border-border p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{avgProgress}%</p>
          <p className="text-xs text-muted-foreground mt-0.5">Avg. Progress</p>
        </div>
      </div>

      {/* Programme list */}
      {programmes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
          <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">No programmes yet</p>
          <p className="text-xs text-muted-foreground mt-1">Enrolled programmes will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {programmes.map((prog) => (
            <div key={prog.id} className="p-4 rounded-xl border border-border bg-card space-y-3 hover:bg-muted/30 transition-all cursor-pointer">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-tight">{prog.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{prog.provider} · NQF {prog.nqf_level}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full capitalize flex-shrink-0 ${statusColor[prog.status]}`}>
                  {prog.status}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {prog.modules_completed} / {prog.total_modules} modules
                  </span>
                  <span className="font-semibold text-foreground">{prog.progress_pct}%</span>
                </div>
                <Progress value={prog.progress_pct} className="h-2" />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {prog.status === "completed"
                  ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Certificate earned</>
                  : prog.due_date
                    ? <><Calendar className="w-3.5 h-3.5" /> Due: {new Date(prog.due_date).toLocaleDateString("en-ZA", { month: "short", year: "numeric" })}</>
                    : null
                }
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
