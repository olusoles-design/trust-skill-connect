import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, AlertTriangle, UserCheck, MapPin, Filter } from "lucide-react";

interface PipelineLearner {
  id: string;
  name: string;
  programme: string;
  nqfLevel: number;
  province: string;
  sdp: string;
  phase: "registered" | "active" | "assessment" | "completed" | "at_risk";
  attendance: number;
  completionDate: string;
  stipendPaid: boolean;
}

const MOCK: PipelineLearner[] = [
  { id:"1",  name:"Aisha Khumalo",   programme:"IT Support NQF3",      nqfLevel:3, province:"Gauteng",    sdp:"Bytes Academy",   phase:"active",      attendance:92, completionDate:"Nov 2025", stipendPaid:true  },
  { id:"2",  name:"Thabo Dlamini",   programme:"Business Admin NQF3",  nqfLevel:3, province:"Gauteng",    sdp:"Bytes Academy",   phase:"at_risk",     attendance:61, completionDate:"Nov 2025", stipendPaid:true  },
  { id:"3",  name:"Zanele Mokoena",  programme:"Data Analytics NQF4",  nqfLevel:4, province:"KZN",        sdp:"TIH Training",    phase:"completed",   attendance:100,completionDate:"Sep 2025", stipendPaid:true  },
  { id:"4",  name:"Sipho Ndlovu",    programme:"IT Support NQF3",      nqfLevel:3, province:"Gauteng",    sdp:"Bytes Academy",   phase:"active",      attendance:88, completionDate:"Nov 2025", stipendPaid:true  },
  { id:"5",  name:"Nomvula Sithole", programme:"Customer Service NQF3",nqfLevel:3, province:"W. Cape",   sdp:"Growth Hub",      phase:"registered",  attendance:0,  completionDate:"Apr 2026", stipendPaid:false },
  { id:"6",  name:"Kagiso Motsepe",  programme:"Data Analytics NQF4",  nqfLevel:4, province:"Gauteng",    sdp:"TIH Training",    phase:"assessment",  attendance:95, completionDate:"Dec 2025", stipendPaid:true  },
  { id:"7",  name:"Lerato Phiri",    programme:"Management NQF4",      nqfLevel:4, province:"Free State", sdp:"Empower SA",      phase:"active",      attendance:79, completionDate:"Jan 2026", stipendPaid:true  },
  { id:"8",  name:"Bongani Dube",    programme:"Business Admin NQF3",  nqfLevel:3, province:"Limpopo",    sdp:"Bytes Academy",   phase:"registered",  attendance:0,  completionDate:"Mar 2026", stipendPaid:false },
];

const PHASES = {
  registered:  { label:"Registered",  icon:UserCheck,    color:"bg-muted text-muted-foreground",         dot:"bg-muted-foreground"     },
  active:      { label:"Active",      icon:Clock,        color:"bg-primary/15 text-primary",             dot:"bg-primary"              },
  assessment:  { label:"Assessment",  icon:CheckCircle2, color:"bg-yellow-500/15 text-yellow-600",       dot:"bg-yellow-500"           },
  completed:   { label:"Completed",   icon:CheckCircle2, color:"bg-emerald-500/15 text-emerald-600",     dot:"bg-emerald-500"          },
  at_risk:     { label:"At Risk",     icon:AlertTriangle,color:"bg-destructive/10 text-destructive",     dot:"bg-destructive"          },
};

export function LearnerPipelineWidget() {
  const [province, setProvince] = useState("All");
  const provinces = ["All", ...Array.from(new Set(MOCK.map(l => l.province)))];

  const filtered = MOCK.filter(l => province === "All" || l.province === province);

  const stats = {
    total:     MOCK.length,
    active:    MOCK.filter(l => l.phase === "active").length,
    at_risk:   MOCK.filter(l => l.phase === "at_risk").length,
    completed: MOCK.filter(l => l.phase === "completed").length,
    avgAtt:    Math.round(MOCK.filter(l => l.attendance > 0).reduce((s, l) => s + l.attendance, 0) / MOCK.filter(l => l.attendance > 0).length),
  };

  return (
    <div className="space-y-4">
      {/* Pipeline KPIs */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label:"Total",     val:stats.total,     cls:"bg-muted/40 border-border text-foreground" },
          { label:"Active",    val:stats.active,    cls:"bg-primary/10 border-primary/20 text-primary" },
          { label:"At Risk",   val:stats.at_risk,   cls:"bg-destructive/10 border-destructive/20 text-destructive" },
          { label:"Completed", val:stats.completed, cls:"bg-emerald-500/10 border-emerald-500/20 text-emerald-600" },
          { label:"Avg Att.",  val:`${stats.avgAtt}%`, cls:"bg-muted/40 border-border text-foreground" },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border p-2.5 text-center ${k.cls}`}>
            <p className="text-lg font-black">{k.val}</p>
            <p className="text-[10px] opacity-70">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Province filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
        {provinces.map(p => (
          <button
            key={p}
            onClick={() => setProvince(p)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${province === p ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Learner list */}
      <div className="space-y-2">
        {filtered.map(l => {
          const ph = PHASES[l.phase];
          const Icon = ph.icon;
          return (
            <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                {l.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-foreground truncate">{l.name}</p>
                  <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${ph.color}`}>
                    <Icon className="w-2.5 h-2.5" />{ph.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                  <span>{l.programme}</span>
                  <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{l.province}</span>
                  <span>NQF {l.nqfLevel}</span>
                </div>
                {l.attendance > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={l.attendance} className="h-1 flex-1" />
                    <span className="text-[10px] text-muted-foreground w-8">{l.attendance}%</span>
                  </div>
                )}
              </div>
              <div className="text-right text-[10px] text-muted-foreground flex-shrink-0">
                <p>{l.sdp}</p>
                <p>{l.completionDate}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
