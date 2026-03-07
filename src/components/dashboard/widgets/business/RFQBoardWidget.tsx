import { useState } from "react";
import { Clock, CheckCircle2, AlertCircle, FileText, Send, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface RFQItem {
  id: string;
  title: string;
  requester: string;
  category: string;
  budget: string;
  deadline: string;
  status: "open" | "quoted" | "awarded" | "closed";
  submissions: number;
  description: string;
  province: string;
}

const RFQS: RFQItem[] = [
  { id:"1", title:"50 Learner Guides Printed — NQF3 IT", requester:"Bytes Academy",     category:"Reprographics",    budget:"R12 500", deadline:"Fri 10 Jan", status:"open",   submissions:1, description:"A5 full colour, saddle-stitched, 48 pages each. Delivery to Braamfontein.",            province:"Gauteng"   },
  { id:"2", title:"Training Venue — Durban 3 Days",       requester:"MICT SETA",         category:"Venues",           budget:"R22 000", deadline:"Mon 13 Jan", status:"open",   submissions:4, description:"Need conference room for 30 pax, projector, catering. 3 consecutive weekdays.",       province:"KZN"       },
  { id:"3", title:"Welding PPE Kits × 25",                requester:"MerSETA",           category:"Equipment",        budget:"R45 000", deadline:"Wed 15 Jan", status:"quoted", submissions:6, description:"Full PPE kits: helmet, gloves, apron, boots (size 8-11). Delivery to Germiston.",     province:"Gauteng"   },
  { id:"4", title:"LMS Licences 100 Users 12 Months",     requester:"Sanlam Academy",   category:"Technology",       budget:"R85 000", deadline:"Fri 17 Jan", status:"awarded",submissions:5, description:"Cloud-based LMS with SCORM support, mobile app, SA hosting preferred.",                province:"National"  },
  { id:"5", title:"Assessor for Business Admin NQF3",     requester:"Growth Hub",        category:"Practitioners",    budget:"R18 000", deadline:"Tue 14 Jan", status:"open",   submissions:2, description:"4 days onsite, Cape Town. Must be registered ETDP SETA assessor. Bring own tools.",    province:"W. Cape"   },
];

const STATUS_CFG = {
  open:    { icon:Clock,         color:"text-primary",     bg:"bg-primary/10 border-primary/20"           },
  quoted:  { icon:FileText,      color:"text-yellow-600",  bg:"bg-yellow-500/10 border-yellow-500/20"     },
  awarded: { icon:CheckCircle2,  color:"text-emerald-600", bg:"bg-emerald-500/10 border-emerald-500/20"   },
  closed:  { icon:AlertCircle,   color:"text-muted-foreground", bg:"bg-muted border-border"               },
};

export function RFQBoardWidget() {
  const [filter,    setFilter]    = useState<"all" | RFQItem["status"]>("all");
  const [expanded,  setExpanded]  = useState<string | null>(null);

  const filtered = RFQS.filter(r => filter === "all" || r.status === filter);
  const openCount = RFQS.filter(r => r.status === "open").length;

  return (
    <div className="space-y-4">
      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label:"Total",   val:RFQS.length,                              cls:"bg-muted/40 border-border text-foreground" },
          { label:"Open",    val:openCount,                                cls:"bg-primary/10 border-primary/20 text-primary" },
          { label:"Quoted",  val:RFQS.filter(r=>r.status==="quoted").length,  cls:"bg-yellow-500/10 border-yellow-500/20 text-yellow-600" },
          { label:"Awarded", val:RFQS.filter(r=>r.status==="awarded").length, cls:"bg-emerald-500/10 border-emerald-500/20 text-emerald-600" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-2.5 text-center ${s.cls}`}>
            <p className="text-lg font-black">{s.val}</p>
            <p className="text-[10px] opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter + post */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
          {(["all","open","quoted","awarded"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-semibold capitalize transition-all ${filter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={() => toast.info("Post RFQ form — coming soon")}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-semibold hover:bg-primary/90 transition-all flex-shrink-0"
        >
          <Plus className="w-3 h-3" /> Post RFQ
        </button>
      </div>

      {/* RFQ cards */}
      <div className="space-y-2.5">
        {filtered.map(rfq => {
          const cfg = STATUS_CFG[rfq.status];
          const Icon = cfg.icon;
          const open = expanded === rfq.id;
          return (
            <div key={rfq.id} className={`rounded-xl border transition-all ${open ? "border-primary/30 bg-primary/5" : "border-border bg-card hover:border-primary/20"}`}>
              <div
                className="flex items-start gap-3 p-4 cursor-pointer"
                onClick={() => setExpanded(open ? null : rfq.id)}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg.split(" ")[0]}`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground leading-tight">{rfq.title}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${cfg.bg} ${cfg.color}`}>{rfq.status}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{rfq.requester} · {rfq.category} · {rfq.province}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                    <span className="font-semibold text-foreground">{rfq.budget}</span>
                    <span className="text-destructive font-medium">Due {rfq.deadline}</span>
                    <span>{rfq.submissions} quote{rfq.submissions !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-1" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-1" />}
              </div>

              {open && (
                <div className="px-4 pb-4 space-y-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground leading-relaxed pt-3">{rfq.description}</p>
                  {rfq.status === "open" && (
                    <button
                      onClick={() => toast.success(`Quote submitted for "${rfq.title}"`)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all"
                    >
                      <Send className="w-3 h-3" /> Submit Quote
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
