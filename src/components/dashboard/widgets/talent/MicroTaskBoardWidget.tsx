import { useState } from "react";
import { Clock, MapPin, Zap, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MicroTask {
  id: string;
  title: string;
  category: string;
  pay: string;
  duration: string;
  location: "Remote" | "On-site" | "Hybrid";
  urgency: "Today" | "This week" | "Flexible";
  skills: string[];
  employer: string;
  status: "available" | "applied" | "in_progress";
}

const MOCK: MicroTask[] = [
  {
    id: "1", title: "Data Capture & Spreadsheet Clean-up",
    category: "Admin", pay: "R480", duration: "4 hrs",
    location: "Remote", urgency: "Today",
    skills: ["Excel", "Data Entry"], employer: "Tiger Brands",
    status: "available",
  },
  {
    id: "2", title: "Social Media Content Scheduling",
    category: "Marketing", pay: "R350", duration: "3 hrs",
    location: "Remote", urgency: "Today",
    skills: ["Canva", "Scheduling tools"], employer: "Cape Creative Co.",
    status: "applied",
  },
  {
    id: "3", title: "Venue Setup & Event Support",
    category: "Events", pay: "R700", duration: "7 hrs",
    location: "On-site", urgency: "This week",
    skills: ["Physical labour", "Customer service"], employer: "Sandton Events",
    status: "available",
  },
  {
    id: "4", title: "Customer Service Call Handling",
    category: "CX", pay: "R250/hr", duration: "Shift",
    location: "Hybrid", urgency: "This week",
    skills: ["Communication", "CRM"], employer: "Telkom",
    status: "in_progress",
  },
  {
    id: "5", title: "Inventory Count & Labelling",
    category: "Warehouse", pay: "R920", duration: "8 hrs",
    location: "On-site", urgency: "Flexible",
    skills: ["Counting", "Attention to detail"], employer: "Massmart",
    status: "available",
  },
];

const statusConfig = {
  available:   { label: "Apply",       color: "bg-primary/10 text-primary border-primary/20" },
  applied:     { label: "Applied ✓",   color: "bg-muted text-muted-foreground border-border" },
  in_progress: { label: "In Progress", color: "bg-accent/20 text-accent-foreground border-accent/30" },
};

const urgencyColor: Record<MicroTask["urgency"], string> = {
  "Today":     "bg-destructive/10 text-destructive",
  "This week": "bg-accent/20 text-accent-foreground",
  "Flexible":  "bg-muted text-muted-foreground",
};

type CategoryFilter = "All" | string;

export function MicroTaskBoardWidget() {
  const [catFilter, setCatFilter] = useState<CategoryFilter>("All");

  const categories = ["All", ...Array.from(new Set(MOCK.map(t => t.category)))];
  const filtered = catFilter === "All" ? MOCK : MOCK.filter(t => t.category === catFilter);

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
          <p className="text-xs text-muted-foreground">Estimated earnings this week</p>
          <p className="text-base font-bold text-foreground">R2 700 <span className="text-xs font-normal text-muted-foreground">from 3 tasks</span></p>
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {filtered.map((task) => {
          const cfg = statusConfig[task.status];
          return (
            <div key={task.id} className="p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold text-foreground">{task.title}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${urgencyColor[task.urgency]}`}>
                      {task.urgency}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{task.employer}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{task.duration}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{task.location}</span>
                    <span className="font-semibold text-foreground">{task.pay}</span>
                  </div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {task.skills.map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">{s}</span>
                    ))}
                  </div>
                </div>
                <button className={`flex-shrink-0 mt-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:scale-[1.02] ${cfg.color}`}>
                  {task.status === "available" && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                  {cfg.label}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
