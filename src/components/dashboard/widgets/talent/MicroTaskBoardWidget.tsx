import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, MapPin, Zap, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

interface MicroTask {
  id: string;
  title: string;
  category: string | null;
  pay: string | null;
  duration: string | null;
  location: string;
  urgency: string;
  skills: string[] | null;
  employer: string | null;
  status: string;
}

const urgencyColor: Record<string, string> = {
  "Today":     "bg-destructive/10 text-destructive",
  "This week": "bg-accent/20 text-accent-foreground",
  "Flexible":  "bg-muted text-muted-foreground",
};

export function MicroTaskBoardWidget() {
  const [catFilter, setCatFilter] = useState("All");

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ["micro-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("micro_tasks")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MicroTask[];
    },
  });

  const categories = ["All", ...Array.from(new Set(tasks.map(t => t.category).filter(Boolean) as string[]))];
  const filtered = catFilter === "All" ? tasks : tasks.filter(t => t.category === catFilter);

  if (isLoading) return (
    <div className="space-y-3">
      {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
      <AlertCircle className="w-4 h-4" /> Failed to load micro-tasks
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Category filter pills */}
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

      {/* Earnings summary */}
      <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/40 border border-border">
        <Zap className="w-5 h-5 text-primary flex-shrink-0" />
        <div>
          <p className="text-xs text-muted-foreground">{tasks.length} tasks available right now</p>
          <p className="text-base font-bold text-foreground">Quick income opportunities</p>
        </div>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No tasks in this category right now.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <div key={task.id} className="p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
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
                      {task.skills.map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button className="flex-shrink-0 mt-1 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-primary/10 text-primary border-primary/20 transition-all hover:scale-[1.02] hover:bg-primary hover:text-primary-foreground">
                  <CheckCircle2 className="w-3 h-3 inline mr-1" />
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
