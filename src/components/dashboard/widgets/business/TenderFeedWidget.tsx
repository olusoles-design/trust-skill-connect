import { useState } from "react";
import { Users, MapPin, Clock, Tag, Send, Filter, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface Demand {
  id: string;
  title: string;
  sponsor: string;
  learners: number;
  nqfLevel: number;
  province: string;
  sector: string;
  startDate: string;
  budget: string;
  urgency: "high" | "medium" | "low";
  bids: number;
  deadline: string;
}

const MOCK: Demand[] = [
  { id:"1", title:"NQF4 Management Programme — 20 Learners",     sponsor:"Absa Group",       learners:20, nqfLevel:4, province:"Johannesburg", sector:"Finance",      startDate:"Feb 2026", budget:"R480 000",  urgency:"high",   bids:3,  deadline:"15 Jan" },
  { id:"2", title:"IT Support Learnership — 15 Learners",        sponsor:"Telkom SA",        learners:15, nqfLevel:3, province:"Cape Town",    sector:"ICT",          startDate:"Jan 2026", budget:"R315 000",  urgency:"high",   bids:7,  deadline:"20 Jan" },
  { id:"3", title:"Business Admin NQF3 — 30 Learners",           sponsor:"Shoprite Holdings",learners:30, nqfLevel:3, province:"Multiple",     sector:"Retail",       startDate:"Mar 2026", budget:"R630 000",  urgency:"medium", bids:5,  deadline:"01 Feb" },
  { id:"4", title:"Data Analytics NQF5 — 10 Learners",           sponsor:"Discovery Ltd",    learners:10, nqfLevel:5, province:"Sandton",      sector:"Insurance",    startDate:"Apr 2026", budget:"R400 000",  urgency:"low",    bids:2,  deadline:"15 Feb" },
  { id:"5", title:"Engineering Fundamentals NQF3 — 25 Learners", sponsor:"Eskom",            learners:25, nqfLevel:3, province:"Mpumalanga",   sector:"Energy",       startDate:"Jan 2026", budget:"R550 000",  urgency:"high",   bids:1,  deadline:"10 Jan" },
];

const URGENCY = {
  high:   "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  low:    "bg-muted text-muted-foreground border-border",
};

export function TenderFeedWidget() {
  const [filter, setFilter] = useState<"all" | number>("all");
  const nqfLevels = Array.from(new Set(MOCK.map(d => d.nqfLevel))).sort();
  const filtered = MOCK.filter(d => filter === "all" || d.nqfLevel === filter);

  return (
    <div className="space-y-4">
      {/* Live header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">{MOCK.length} live requirements from Sponsors</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <TrendingUp className="w-3 h-3 text-primary" />
          <span className="text-primary font-medium">+3 new today</span>
        </div>
      </div>

      {/* NQF filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3 h-3 text-muted-foreground" />
        <button
          onClick={() => setFilter("all")}
          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${filter === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}
        >All NQF</button>
        {nqfLevels.map(n => (
          <button
            key={n}
            onClick={() => setFilter(n)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${filter === n ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}
          >NQF {n}</button>
        ))}
      </div>

      {/* Demand cards */}
      <div className="space-y-3">
        {filtered.map(d => (
          <div key={d.id} className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground">{d.title}</p>
                  <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border font-bold capitalize ${URGENCY[d.urgency]}`}>
                    {d.urgency === "high" ? "🔥 " : ""}{d.urgency} priority
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{d.sponsor} · {d.sector}</p>

                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{d.learners} learners</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{d.province}</span>
                  <span className="flex items-center gap-1"><Tag className="w-3 h-3" />NQF {d.nqfLevel}</span>
                  <span className="font-semibold text-foreground">{d.budget}</span>
                </div>

                <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Starts {d.startDate}</span>
                  <span className="text-destructive font-medium">Bid by {d.deadline}</span>
                  <span>{d.bids} {d.bids === 1 ? "bid" : "bids"} submitted</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => toast.success(`Bid submitted for "${d.title}"`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all"
              >
                <Send className="w-3 h-3" /> Submit Bid
              </button>
              <button className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
