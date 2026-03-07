import { useState } from "react";
import { Bell, Zap, MapPin, Calendar, TrendingUp, ChevronRight, Megaphone } from "lucide-react";
import { toast } from "sonner";

interface Alert {
  id: string;
  type: "demand_signal" | "rfq_posted" | "tender_closing";
  title: string;
  detail: string;
  province: string;
  category: string;
  value: string;
  urgency: "high" | "medium" | "low";
  date: string;
  sdps: number;
}

const ALERTS: Alert[] = [
  {
    id:"1", type:"demand_signal",
    title:"5 Engineering Programmes Starting in Gauteng Q1",
    detail:"SDPs in Gauteng are planning 5 Engineering/Artisan programmes next quarter. Expected demand: 250+ consumable kits, welding equipment, PPE.",
    province:"Gauteng", category:"Equipment & Consumables", value:"~R850 000", urgency:"high", date:"Predicted: Feb 2026", sdps:5,
  },
  {
    id:"2", type:"rfq_posted",
    title:"50 Learner Guides Needed — Printed by Friday",
    detail:"Bytes Academy posted an RFQ for printed learning materials NQF3 IT Support. Deadline Friday COB.",
    province:"Cape Town", category:"Reprographics", value:"R12 500", urgency:"high", date:"Closes 10 Jan", sdps:1,
  },
  {
    id:"3", type:"demand_signal",
    title:"Hospitality Venues in Demand — KZN Coast",
    detail:"3 SDPs are scheduling short courses in KZN Q2. Venue capacity needs: 20–30 pax, 4 days each, AV-equipped.",
    province:"KwaZulu-Natal", category:"Venues", value:"~R90 000", urgency:"medium", date:"Predicted: Mar 2026", sdps:3,
  },
  {
    id:"4", type:"tender_closing",
    title:"MICT SETA Technology Solutions Tender",
    detail:"MICT SETA requires LMS licences and e-learning tools for 500 users. Closing 20 Jan.",
    province:"National", category:"Technology Solutions", value:"R950 000", urgency:"medium", date:"Closes 20 Jan", sdps:0,
  },
  {
    id:"5", type:"demand_signal",
    title:"Furniture Demand for New Training Centres",
    detail:"Two SDPs in Limpopo are opening new training centres. Combined need: 80+ learner desks, 4 classrooms.",
    province:"Limpopo", category:"Furniture & Equipment", value:"~R240 000", urgency:"low", date:"Predicted: Apr 2026", sdps:2,
  },
];

const TYPE_CFG = {
  demand_signal: { icon:Zap,        label:"AI Demand Signal", color:"text-yellow-600",  bg:"bg-yellow-500/10 border-yellow-500/20" },
  rfq_posted:    { icon:Bell,       label:"RFQ Posted",       color:"text-primary",     bg:"bg-primary/10 border-primary/20"       },
  tender_closing:{ icon:Calendar,   label:"Tender",           color:"text-destructive", bg:"bg-destructive/10 border-destructive/20"},
};

const URGENCY_DOT: Record<string, string> = {
  high:   "bg-destructive animate-pulse",
  medium: "bg-yellow-500",
  low:    "bg-muted-foreground",
};

export function ProcurementAlertsWidget() {
  const [category, setCategory] = useState("All");
  const categories = ["All", ...Array.from(new Set(ALERTS.map(a => a.category)))];
  const filtered = ALERTS.filter(a => category === "All" || a.category === category);

  return (
    <div className="space-y-4">
      {/* Header with live indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-muted-foreground">AI-powered demand intelligence</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{ALERTS.length} active signals</span>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map(c => (
          <button key={c}
            onClick={() => setCategory(c)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${category === c ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Alert cards */}
      <div className="space-y-3">
        {filtered.map(a => {
          const cfg = TYPE_CFG[a.type];
          const TypeIcon = cfg.icon;
          return (
            <div key={a.id} className={`p-4 rounded-xl border ${cfg.bg} hover:shadow-sm transition-all`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <TypeIcon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground leading-tight">{a.title}</p>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${URGENCY_DOT[a.urgency]}`} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{a.detail}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{a.province}</span>
                    <span className="font-semibold text-foreground">{a.value}</span>
                    <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{a.date}</span>
                    {a.sdps > 0 && <span>{a.sdps} SDP{a.sdps > 1 ? "s" : ""} identified</span>}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => toast.success(`Alert actioned: ${a.title}`)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-foreground text-background text-[10px] font-semibold hover:opacity-90 transition-all"
                    >
                      <Megaphone className="w-3 h-3" /> Advertise Now
                    </button>
                    <button className="flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg border border-border text-[10px] text-muted-foreground hover:text-foreground transition-all">
                      Details <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
