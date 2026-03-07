import { useState } from "react";
import { Plus, Eye, Edit2, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Opportunity {
  id: string;
  title: string;
  type: "Job" | "Learnership" | "Programme" | "Gig";
  applications: number;
  views: number;
  status: "active" | "draft" | "closed";
  postedAt: string;
  closing: string;
}

const MOCK: Opportunity[] = [
  { id:"1", title:"Junior Software Developer", type:"Job", applications:34, views:210, status:"active", postedAt:"3 days ago", closing:"30 Nov 2025" },
  { id:"2", title:"IT Learnership Programme 2025", type:"Learnership", applications:128, views:843, status:"active", postedAt:"1 week ago", closing:"31 Oct 2025" },
  { id:"3", title:"Digital Marketing Internship", type:"Job", applications:61, views:390, status:"active", postedAt:"5 days ago", closing:"15 Dec 2025" },
  { id:"4", title:"Data Analytics Short Course", type:"Programme", applications:0, views:12, status:"draft", postedAt:"Today", closing:"—" },
  { id:"5", title:"Customer Service Gig (Weekend)", type:"Gig", applications:7, views:55, status:"closed", postedAt:"2 weeks ago", closing:"Passed" },
];

const statusColor: Record<Opportunity["status"], string> = {
  active: "bg-green-500/15 text-green-600",
  draft:  "bg-muted text-muted-foreground",
  closed: "bg-destructive/10 text-destructive",
};
const typeColor: Record<Opportunity["type"], string> = {
  Job:        "bg-primary/10 text-primary",
  Learnership:"bg-accent/20 text-accent-foreground",
  Programme:  "bg-secondary/15 text-secondary-foreground",
  Gig:        "bg-muted text-muted-foreground",
};

export function OpportunityManagerWidget() {
  const [tab, setTab] = useState<"all" | Opportunity["status"]>("all");
  const filtered = MOCK.filter(o => tab === "all" || o.status === tab);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label:"Total Posted",   value: MOCK.length },
          { label:"Active",         value: MOCK.filter(o=>o.status==="active").length },
          { label:"Total Applicants", value: MOCK.reduce((s,o)=>s+o.applications,0) },
          { label:"Total Views",    value: MOCK.reduce((s,o)=>s+o.views,0) },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl bg-muted/40 border border-border p-3 text-center">
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs + CTA */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
          {(["all","active","draft","closed"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}>{t}</button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all">
          <Plus className="w-3.5 h-3.5" /> Post New
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map(opp => (
          <div key={opp.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all group">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <p className="text-sm font-semibold text-foreground">{opp.title}</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${typeColor[opp.type]}`}>{opp.type}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${statusColor[opp.status]}`}>{opp.status}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{opp.applications} applicants</span>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{opp.views} views</span>
                <span>Closes: {opp.closing}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"><Eye className="w-3.5 h-3.5" /></button>
              <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
              <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
