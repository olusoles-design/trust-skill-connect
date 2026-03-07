import { AlertTriangle, Clock, CheckCircle2, ExternalLink } from "lucide-react";

interface ComplianceItem {
  id: string;
  title: string;
  entity: string;
  type: "credential" | "accreditation" | "licence" | "report" | "payment";
  urgency: "critical" | "warning" | "info";
  daysLeft?: number;
  expiry: string;
  action: string;
}

const MOCK: ComplianceItem[] = [
  { id:"1", title:"SETA Accreditation Renewal",       entity:"Bytes Academy",    type:"accreditation", urgency:"critical", daysLeft:12,  expiry:"15 Nov 2025", action:"Renew Now" },
  { id:"2", title:"B-BBEE Certificate Expiry",         entity:"TechCorp SA",      type:"credential",    urgency:"critical", daysLeft:18,  expiry:"21 Nov 2025", action:"Upload New" },
  { id:"3", title:"WSP Submission Deadline",           entity:"All Employers",    type:"report",        urgency:"warning",  daysLeft:45,  expiry:"30 Apr 2026", action:"Prepare" },
  { id:"4", title:"Assessor Registration Expiry",      entity:"Aisha Khumalo",    type:"credential",    urgency:"warning",  daysLeft:60,  expiry:"5 Jan 2026",  action:"Remind" },
  { id:"5", title:"Levy Payment Due",                  entity:"DataTech SA",      type:"payment",       urgency:"info",     daysLeft:14,  expiry:"19 Nov 2025", action:"View" },
  { id:"6", title:"Fire Safety Certificate",           entity:"Centurion Academy",type:"licence",       urgency:"info",     expiry:"Mar 2026",                  action:"View" },
];

const urgencyConfig = {
  critical: { icon:AlertTriangle, color:"bg-destructive/10 text-destructive", border:"border-destructive/20", dot:"bg-destructive" },
  warning:  { icon:Clock,         color:"bg-accent/20 text-accent-foreground", border:"border-accent/30",      dot:"bg-accent" },
  info:     { icon:CheckCircle2,  color:"bg-muted text-muted-foreground",      border:"border-border",          dot:"bg-muted-foreground" },
};

export function ComplianceMonitorWidget() {
  const critical = MOCK.filter(m => m.urgency === "critical").length;
  const warning  = MOCK.filter(m => m.urgency === "warning").length;

  return (
    <div className="space-y-4">
      {/* Alert summary */}
      <div className="flex gap-3">
        <div className="flex-1 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-center">
          <p className="text-2xl font-bold text-destructive">{critical}</p>
          <p className="text-xs text-destructive/70">Critical</p>
        </div>
        <div className="flex-1 rounded-xl bg-accent/20 border border-accent/30 p-3 text-center">
          <p className="text-2xl font-bold text-accent-foreground">{warning}</p>
          <p className="text-xs text-accent-foreground/70">Warnings</p>
        </div>
        <div className="flex-1 rounded-xl bg-muted/40 border border-border p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{MOCK.length}</p>
          <p className="text-xs text-muted-foreground">Total Items</p>
        </div>
      </div>

      {/* List sorted by urgency */}
      <div className="space-y-2">
        {[...MOCK].sort((a,b) => {
          const order = { critical:0, warning:1, info:2 };
          return order[a.urgency] - order[b.urgency];
        }).map(item => {
          const cfg = urgencyConfig[item.urgency];
          const Icon = cfg.icon;
          return (
            <div key={item.id} className={`flex items-start gap-3 p-3.5 rounded-xl border ${cfg.border} bg-card hover:bg-muted/30 transition-all group`}>
              <div className={`w-8 h-8 rounded-lg ${cfg.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.entity}</p>
                <div className="flex items-center gap-2 mt-1">
                  {item.daysLeft !== undefined && (
                    <span className={`text-xs font-semibold ${item.urgency === "critical" ? "text-destructive" : item.urgency === "warning" ? "text-accent-foreground" : "text-muted-foreground"}`}>
                      {item.daysLeft}d left
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{item.expiry}</span>
                </div>
              </div>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 whitespace-nowrap flex-shrink-0">
                {item.action} <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
