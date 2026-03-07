import { useState } from "react";
import { Send, Clock, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Application {
  id: string;
  title: string;
  company: string;
  type: "Learnership" | "Job" | "Gig" | "Bursary";
  status: "pending" | "shortlisted" | "rejected" | "accepted";
  appliedAt: string;
  stipend?: string;
}

const MOCK: Application[] = [
  { id: "1", title: "Software Development Learnership", company: "Investec", type: "Learnership", status: "shortlisted", appliedAt: "2 days ago", stipend: "R5 200/mo" },
  { id: "2", title: "Data Analytics Bursary", company: "Absa Foundation", type: "Bursary", status: "pending", appliedAt: "5 days ago" },
  { id: "3", title: "HR Administration Learnership", company: "Discovery", type: "Learnership", status: "rejected", appliedAt: "2 weeks ago", stipend: "R4 000/mo" },
  { id: "4", title: "UX Design Gig", company: "Cape Digital Studio", type: "Gig", status: "accepted", appliedAt: "1 week ago", stipend: "R850/day" },
  { id: "5", title: "Electrical Apprenticeship", company: "Eskom", type: "Learnership", status: "pending", appliedAt: "3 days ago", stipend: "R6 500/mo" },
];

const STATUS_CONFIG = {
  pending:     { label: "Pending",     icon: Clock,         color: "bg-muted text-muted-foreground" },
  shortlisted: { label: "Shortlisted", icon: ChevronRight,  color: "bg-primary/15 text-primary" },
  accepted:    { label: "Accepted",    icon: CheckCircle2,  color: "bg-green-500/15 text-green-600" },
  rejected:    { label: "Rejected",    icon: XCircle,       color: "bg-destructive/10 text-destructive" },
};

type Filter = "all" | Application["status"];

export function MyApplicationsWidget() {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = MOCK.filter(a => filter === "all" || a.status === filter);

  const counts = {
    pending:     MOCK.filter(a => a.status === "pending").length,
    shortlisted: MOCK.filter(a => a.status === "shortlisted").length,
    accepted:    MOCK.filter(a => a.status === "accepted").length,
    rejected:    MOCK.filter(a => a.status === "rejected").length,
  };

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {(Object.entries(counts) as [Application["status"], number][]).map(([status, count]) => {
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
        {filtered.map((app) => {
          const cfg = STATUS_CONFIG[app.status];
          const Icon = cfg.icon;
          return (
            <div key={app.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all group cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Send className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{app.title}</p>
                <p className="text-xs text-muted-foreground">{app.company} · {app.appliedAt}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {app.stipend && (
                  <span className="text-xs font-medium text-primary hidden sm:block">{app.stipend}</span>
                )}
                <Badge variant="outline" className={`gap-1 text-xs ${cfg.color} border-0`}>
                  <Icon className="w-3 h-3" /> {cfg.label}
                </Badge>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No {filter !== "all" ? filter : ""} applications yet.
          </div>
        )}
      </div>
    </div>
  );
}
