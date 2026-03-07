import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Search } from "lucide-react";

interface Learner {
  id: string;
  name: string;
  programme: string;
  progress: number;
  status: "on_track" | "at_risk" | "completed" | "pending";
  startDate: string;
  nqfLevel: number;
  stipend: string;
}

const MOCK: Learner[] = [
  { id:"1", name:"Aisha Khumalo",    programme:"IT Support Learnership",  progress:78, status:"on_track",  startDate:"Jan 2025", nqfLevel:3, stipend:"R4 200" },
  { id:"2", name:"Thabo Dlamini",    programme:"Business Admin",          progress:45, status:"at_risk",   startDate:"Jan 2025", nqfLevel:3, stipend:"R3 800" },
  { id:"3", name:"Zanele Mokoena",   programme:"Data Analytics",          progress:100,status:"completed", startDate:"Jul 2024", nqfLevel:4, stipend:"R5 500" },
  { id:"4", name:"Sipho Ndlovu",     programme:"IT Support Learnership",  progress:62, status:"on_track",  startDate:"Jan 2025", nqfLevel:3, stipend:"R4 200" },
  { id:"5", name:"Nomvula Sithole",  programme:"Customer Service",        progress:0,  status:"pending",   startDate:"Apr 2025", nqfLevel:3, stipend:"R3 500" },
  { id:"6", name:"Kagiso Motsepe",   programme:"Data Analytics",          progress:88, status:"on_track",  startDate:"Jul 2024", nqfLevel:4, stipend:"R5 500" },
];

const statusConfig = {
  on_track:  { label:"On Track",  color:"bg-green-500/15 text-green-600" },
  at_risk:   { label:"At Risk",   color:"bg-destructive/10 text-destructive" },
  completed: { label:"Completed", color:"bg-primary/15 text-primary" },
  pending:   { label:"Pending",   color:"bg-muted text-muted-foreground" },
};

export function TeamRosterWidget() {
  const [search, setSearch] = useState("");

  const filtered = MOCK.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.programme.toLowerCase().includes(search.toLowerCase())
  );

  const summary = {
    total:     MOCK.length,
    on_track:  MOCK.filter(l=>l.status==="on_track").length,
    at_risk:   MOCK.filter(l=>l.status==="at_risk").length,
    completed: MOCK.filter(l=>l.status==="completed").length,
  };

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
          <p className="text-xs text-green-600/70">On Track</p>
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
          placeholder="Search learners..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Learner</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Programme</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Progress</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Stipend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(l => {
                const cfg = statusConfig[l.status];
                return (
                  <tr key={l.id} className="hover:bg-muted/30 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                          {l.name.split(" ").map(n=>n[0]).join("")}
                        </div>
                        <span className="font-medium text-foreground whitespace-nowrap">{l.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">{l.programme}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <Progress value={l.progress} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground w-8">{l.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-primary text-right hidden sm:table-cell">{l.stipend}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
