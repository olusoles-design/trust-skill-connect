import { Download, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface Report {
  id: string;
  name: string;
  period: string;
  status: "ready" | "generating" | "due";
  dueDate: string;
  format: string;
  lastGenerated?: string;
}

const MOCK: Report[] = [
  { id:"1", name:"Workplace Skills Plan (WSP)",          period:"2025",  status:"due",        dueDate:"30 Apr 2025",  format:"XML + PDF", },
  { id:"2", name:"Annual Training Report (ATR)",         period:"2024",  status:"ready",      dueDate:"30 Apr 2025",  format:"XML + PDF",  lastGenerated:"3 Nov 2025" },
  { id:"3", name:"Pivotal Report",                       period:"2024",  status:"ready",      dueDate:"30 Jun 2025",  format:"PDF",        lastGenerated:"3 Nov 2025" },
  { id:"4", name:"Learner Data Upload (DSD)",            period:"Q3 2025",status:"generating", dueDate:"30 Nov 2025", format:"CSV",        lastGenerated:"Processing..." },
  { id:"5", name:"Levy Contribution Confirmation",       period:"Oct 2025",status:"ready",    dueDate:"15 Dec 2025",  format:"PDF",        lastGenerated:"1 Nov 2025" },
  { id:"6", name:"Discretionary Grant Application",     period:"2025",  status:"due",        dueDate:"15 Dec 2025",  format:"PDF + Forms" },
];

const statusConfig = {
  ready:      { label:"Ready",      icon:CheckCircle2, color:"bg-green-500/15 text-green-600" },
  generating: { label:"Processing", icon:Clock,        color:"bg-primary/15 text-primary" },
  due:        { label:"Due",        icon:AlertCircle,  color:"bg-destructive/10 text-destructive" },
};

export function SETAReportingWidget() {
  const ready = MOCK.filter(r => r.status === "ready").length;
  const due   = MOCK.filter(r => r.status === "due").length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-center">
          <p className="text-xl font-bold text-green-600">{ready}</p>
          <p className="text-xs text-green-600/70">Ready to Submit</p>
        </div>
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-center">
          <p className="text-xl font-bold text-destructive">{due}</p>
          <p className="text-xs text-destructive/70">Action Required</p>
        </div>
        <div className="rounded-xl bg-muted/40 border border-border p-3 text-center">
          <p className="text-xl font-bold text-foreground">{MOCK.length}</p>
          <p className="text-xs text-muted-foreground">Total Reports</p>
        </div>
      </div>

      {/* Report list */}
      <div className="space-y-2">
        {MOCK.map(report => {
          const cfg = statusConfig[report.status];
          const Icon = cfg.icon;
          return (
            <div key={report.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all group">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{report.name}</p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                  <span>{report.period}</span>
                  <span>Due: {report.dueDate}</span>
                  <span className="hidden sm:inline">{report.format}</span>
                  {report.lastGenerated && (
                    <span className="text-primary">{report.lastGenerated}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>
                  <Icon className="w-2.5 h-2.5" /> {cfg.label}
                </span>
                {report.status === "ready" && (
                  <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 text-xs font-medium opacity-0 group-hover:opacity-100 transition-all">
                    <Download className="w-3 h-3" /> Download
                  </button>
                )}
                {report.status === "due" && (
                  <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-medium transition-all">
                    Generate
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
