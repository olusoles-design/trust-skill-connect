import { Progress } from "@/components/ui/progress";
import { CheckCircle2, BookOpen, Calendar } from "lucide-react";

interface Programme {
  id: string;
  title: string;
  provider: string;
  nqfLevel: number;
  progressPct: number;
  modulesCompleted: number;
  totalModules: number;
  dueDate: string;
  status: "active" | "completed" | "paused";
}

const MOCK: Programme[] = [
  {
    id: "1",
    title: "National Certificate: IT Support Services",
    provider: "Bytes Academy",
    nqfLevel: 3,
    progressPct: 68,
    modulesCompleted: 17,
    totalModules: 25,
    dueDate: "Nov 2025",
    status: "active",
  },
  {
    id: "2",
    title: "Fundamentals of Project Management",
    provider: "MICT SETA",
    nqfLevel: 4,
    progressPct: 100,
    modulesCompleted: 12,
    totalModules: 12,
    dueDate: "Jun 2025",
    status: "completed",
  },
  {
    id: "3",
    title: "Business Communication Skills",
    provider: "Centurion Academy",
    nqfLevel: 3,
    progressPct: 23,
    modulesCompleted: 3,
    totalModules: 13,
    dueDate: "Mar 2026",
    status: "active",
  },
];

const statusColor: Record<Programme["status"], string> = {
  active:    "bg-primary/15 text-primary",
  completed: "bg-green-500/15 text-green-600",
  paused:    "bg-muted text-muted-foreground",
};

export function LearningProgressWidget() {
  const activeProgrammes = MOCK.filter(p => p.status !== "completed");
  const completed = MOCK.filter(p => p.status === "completed").length;

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
          <p className="text-2xl font-bold text-foreground">
            {Math.round(MOCK.reduce((s, p) => s + p.progressPct, 0) / MOCK.length)}%
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Avg. Progress</p>
        </div>
      </div>

      {/* Programme list */}
      <div className="space-y-3">
        {MOCK.map((prog) => (
          <div key={prog.id} className="p-4 rounded-xl border border-border bg-card space-y-3 hover:bg-muted/30 transition-all cursor-pointer">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">{prog.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{prog.provider} · NQF {prog.nqfLevel}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full capitalize flex-shrink-0 ${statusColor[prog.status]}`}>
                {prog.status}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {prog.modulesCompleted} / {prog.totalModules} modules
                </span>
                <span className="font-semibold text-foreground">{prog.progressPct}%</span>
              </div>
              <Progress value={prog.progressPct} className="h-2" />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {prog.status === "completed"
                ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Certificate earned</>
                : <><Calendar className="w-3.5 h-3.5" /> Due: {prog.dueDate}</>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
