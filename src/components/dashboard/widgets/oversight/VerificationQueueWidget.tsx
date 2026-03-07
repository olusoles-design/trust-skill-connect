import { useState } from "react";
import { FileText, Eye, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

interface VerificationRequest {
  id: string;
  applicant: string;
  docType: string;
  role: string;
  submittedAt: string;
  priority: "urgent" | "normal" | "low";
  status: "pending" | "in_review" | "approved" | "rejected";
  documents: number;
}

const MOCK: VerificationRequest[] = [
  { id:"1", applicant:"Aisha Khumalo",    docType:"ID + ETDP Registration", role:"Practitioner",    submittedAt:"2 hrs ago",  priority:"urgent", status:"pending",   documents:3 },
  { id:"2", applicant:"Bytes Academy",    docType:"SETA Accreditation Cert", role:"Training Provider",submittedAt:"4 hrs ago",  priority:"urgent", status:"in_review", documents:4 },
  { id:"3", applicant:"Sipho Ndlovu",     docType:"SA ID Document",          role:"Learner",          submittedAt:"Yesterday",  priority:"normal", status:"pending",   documents:1 },
  { id:"4", applicant:"DataTech SA",      docType:"CIPC + B-BBEE Cert",     role:"Employer",         submittedAt:"2 days ago", priority:"normal", status:"approved",  documents:3 },
  { id:"5", applicant:"Nomvula Sithole",  docType:"Matric Certificate",      role:"Learner",          submittedAt:"3 days ago", priority:"low",    status:"rejected",  documents:2 },
];

const statusConfig = {
  pending:   { label:"Pending",   icon:Clock,        color:"bg-muted text-muted-foreground" },
  in_review: { label:"In Review", icon:Eye,          color:"bg-primary/15 text-primary" },
  approved:  { label:"Approved",  icon:CheckCircle2, color:"bg-green-500/15 text-green-600" },
  rejected:  { label:"Rejected",  icon:XCircle,      color:"bg-destructive/10 text-destructive" },
};

const priorityColor = {
  urgent: "bg-destructive/10 text-destructive",
  normal: "bg-primary/10 text-primary",
  low:    "bg-muted text-muted-foreground",
};

export function VerificationQueueWidget() {
  const [filter, setFilter] = useState<"all" | VerificationRequest["status"]>("all");
  const filtered = MOCK.filter(r => filter === "all" || r.status === filter);
  const pending = MOCK.filter(r => r.status === "pending" || r.status === "in_review").length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-center">
          <p className="text-xl font-bold text-destructive">{pending}</p>
          <p className="text-xs text-destructive/70">Pending</p>
        </div>
        <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-center">
          <p className="text-xl font-bold text-green-600">{MOCK.filter(r=>r.status==="approved").length}</p>
          <p className="text-xs text-green-600/70">Approved</p>
        </div>
        <div className="rounded-xl bg-muted/40 border border-border p-3 text-center">
          <p className="text-xl font-bold text-foreground">{MOCK.filter(r=>r.status==="rejected").length}</p>
          <p className="text-xs text-muted-foreground">Rejected</p>
        </div>
        <div className="rounded-xl bg-muted/40 border border-border p-3 text-center">
          <p className="text-xl font-bold text-foreground">94%</p>
          <p className="text-xs text-muted-foreground">SLA Met</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
        {(["all","pending","in_review","approved","rejected"] as const).map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-all whitespace-nowrap ${
              filter === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>{t.replace("_"," ")}</button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map(req => {
          const cfg = statusConfig[req.status];
          const Icon = cfg.icon;
          return (
            <div key={req.id} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground">{req.applicant}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${priorityColor[req.priority]}`}>{req.priority}</span>
                </div>
                <p className="text-xs text-muted-foreground">{req.docType} · {req.role}</p>
                <p className="text-xs text-muted-foreground/70">{req.documents} docs · {req.submittedAt}</p>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>
                  <Icon className="w-2.5 h-2.5" /> {cfg.label}
                </span>
                {(req.status === "pending" || req.status === "in_review") && (
                  <div className="flex gap-1">
                    <button className="px-2 py-1 rounded text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 font-medium transition-all">Reject</button>
                    <button className="px-2 py-1 rounded text-xs bg-primary/15 text-primary hover:bg-primary/25 font-medium transition-all">Approve</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
