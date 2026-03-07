import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

interface Payment {
  id: string;
  learner: string;
  amount: string;
  programme: string;
  provider: string;
  period: string;
  status: "pending" | "approved" | "rejected" | "query";
  submittedAt: string;
}

const MOCK: Payment[] = [
  { id:"1", learner:"Aisha Khumalo",   amount:"R5 200", programme:"IT Learnership",  provider:"Bytes Academy",   period:"Nov 2025", status:"pending",  submittedAt:"Today" },
  { id:"2", learner:"Sipho Ndlovu",    amount:"R4 200", programme:"IT Learnership",  provider:"Bytes Academy",   period:"Nov 2025", status:"pending",  submittedAt:"Today" },
  { id:"3", learner:"Thabo Dlamini",   amount:"R3 800", programme:"Business Admin",  provider:"Centurion Academy",period:"Nov 2025", status:"query",    submittedAt:"Yesterday" },
  { id:"4", learner:"Zanele Mokoena",  amount:"R5 500", programme:"Data Analytics",  provider:"DataTech SA",     period:"Oct 2025", status:"approved", submittedAt:"3 days ago" },
  { id:"5", learner:"Nomvula Sithole", amount:"R3 500", programme:"Customer Service",provider:"Service Academy", period:"Oct 2025", status:"rejected", submittedAt:"5 days ago" },
];

const statusConfig = {
  pending:  { label:"Pending",  icon:Clock,         color:"bg-muted text-muted-foreground",         action:"Review" },
  approved: { label:"Approved", icon:CheckCircle2,  color:"bg-green-500/15 text-green-600",         action:"View" },
  rejected: { label:"Rejected", icon:XCircle,       color:"bg-destructive/10 text-destructive",     action:"View" },
  query:    { label:"Query",    icon:AlertCircle,   color:"bg-accent/20 text-accent-foreground",    action:"Resolve" },
};

export function DisbursementQueueWidget() {
  const pending = MOCK.filter(p => p.status === "pending").length;
  const totalPending = MOCK.filter(p => p.status === "pending").reduce((s,p) => {
    return s + parseFloat(p.amount.replace(/[^0-9]/g,""));
  }, 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex gap-3">
        <div className="flex-1 rounded-xl bg-primary/10 border border-primary/20 p-4">
          <p className="text-xs text-primary/70">Awaiting Approval</p>
          <p className="text-2xl font-bold text-foreground">{pending}</p>
          <p className="text-xs text-muted-foreground">R{(totalPending/1000).toFixed(1)}k total</p>
        </div>
        <div className="flex-1 rounded-xl bg-muted/40 border border-border p-4">
          <p className="text-xs text-muted-foreground">Processed This Month</p>
          <p className="text-2xl font-bold text-foreground">R16.9k</p>
          <p className="text-xs text-primary">4 payments</p>
        </div>
      </div>

      {/* Queue */}
      <div className="space-y-2">
        {MOCK.map(payment => {
          const cfg = statusConfig[payment.status];
          const Icon = cfg.icon;
          return (
            <div key={payment.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{payment.learner}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${cfg.color}`}>
                    <Icon className="w-2.5 h-2.5" /> {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{payment.programme} · {payment.provider}</p>
                <p className="text-xs text-muted-foreground/70">{payment.period} · {payment.submittedAt}</p>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-sm font-bold text-foreground">{payment.amount}</span>
                {payment.status === "pending" && (
                  <div className="flex gap-1.5">
                    <button className="px-2 py-1 rounded text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 font-medium transition-all">Decline</button>
                    <button className="px-2 py-1 rounded text-xs bg-primary/15 text-primary hover:bg-primary/25 font-medium transition-all">Approve</button>
                  </div>
                )}
                {payment.status === "query" && (
                  <button className="px-2 py-1 rounded text-xs bg-accent/20 text-accent-foreground hover:bg-accent/30 font-medium transition-all">Resolve</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
