import { useState } from "react";
import { FileText, Clock, CheckCircle2, AlertCircle, Plus } from "lucide-react";

interface RFQ {
  id: string;
  title: string;
  requester: string;
  category: string;
  budget: string;
  status: "open" | "quoted" | "awarded" | "declined";
  deadline: string;
  submissions: number;
}

const MOCK: RFQ[] = [
  { id:"1", title:"Learning Material Design — NQF 3 IT",  requester:"Bytes Academy",       category:"Materials",   budget:"R45 000",  status:"open",    deadline:"15 Nov 2025", submissions:3 },
  { id:"2", title:"Classroom Furniture — 40 Seats",       requester:"TIH Training Centre", category:"Furniture",   budget:"R120 000", status:"quoted",  deadline:"10 Nov 2025", submissions:6 },
  { id:"3", title:"Assessment Printing Services",         requester:"ETDP SETA",           category:"Printing",    budget:"R18 500",  status:"awarded", deadline:"Closed",       submissions:8 },
  { id:"4", title:"Training Venue — Durban, 3 days",      requester:"MICT SETA",           category:"Venue",       budget:"R22 000",  status:"open",    deadline:"20 Nov 2025", submissions:2 },
  { id:"5", title:"LMS Licence (100 users, 1 year)",      requester:"Sanlam Academy",      category:"Technology",  budget:"R85 000",  status:"declined",deadline:"Closed",       submissions:5 },
];

const statusConfig = {
  open:     { label:"Open",     icon:Clock,         color:"bg-primary/15 text-primary" },
  quoted:   { label:"Quoted",   icon:FileText,      color:"bg-accent/20 text-accent-foreground" },
  awarded:  { label:"Awarded",  icon:CheckCircle2,  color:"bg-green-500/15 text-green-600" },
  declined: { label:"Declined", icon:AlertCircle,   color:"bg-destructive/10 text-destructive" },
};

export function ProcurementDashboardWidget() {
  const [statusFilter, setStatusFilter] = useState<"all" | RFQ["status"]>("all");
  const filtered = MOCK.filter(r => statusFilter === "all" || r.status === statusFilter);

  const openValue = MOCK.filter(r => r.status === "open").reduce((s, r) => {
    const n = parseFloat(r.budget.replace(/[^0-9.]/g, ""));
    return s + (isNaN(n) ? 0 : n);
  }, 0);

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl bg-muted/40 border border-border p-3 text-center">
          <p className="text-xl font-bold text-foreground">{MOCK.length}</p>
          <p className="text-xs text-muted-foreground">Total RFQs</p>
        </div>
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-center">
          <p className="text-xl font-bold text-primary">{MOCK.filter(r=>r.status==="open").length}</p>
          <p className="text-xs text-primary/70">Open</p>
        </div>
        <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-center">
          <p className="text-xl font-bold text-green-600">{MOCK.filter(r=>r.status==="awarded").length}</p>
          <p className="text-xs text-green-600/70">Awarded</p>
        </div>
        <div className="rounded-xl bg-muted/40 border border-border p-3 text-center">
          <p className="text-xl font-bold text-foreground">R{(openValue/1000).toFixed(0)}k</p>
          <p className="text-xs text-muted-foreground">Open Value</p>
        </div>
      </div>

      {/* Filter + CTA */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
          {(["all","open","quoted","awarded","declined"] as const).map(t => (
            <button key={t} onClick={() => setStatusFilter(t)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                statusFilter === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}>{t}</button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all">
          <Plus className="w-3.5 h-3.5" /> Submit Quote
        </button>
      </div>

      {/* RFQ list */}
      <div className="space-y-2">
        {filtered.map(rfq => {
          const cfg = statusConfig[rfq.status];
          const Icon = cfg.icon;
          return (
            <div key={rfq.id} className="p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all cursor-pointer">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{rfq.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{rfq.requester} · {rfq.category}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span className="font-semibold text-foreground">{rfq.budget}</span>
                    <span>Closes: {rfq.deadline}</span>
                    <span>{rfq.submissions} quotes received</span>
                  </div>
                </div>
                <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 mt-0.5 ${cfg.color}`}>
                  <Icon className="w-3 h-3" /> {cfg.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
