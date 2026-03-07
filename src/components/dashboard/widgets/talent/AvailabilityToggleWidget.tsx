import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Star, Eye, Zap, MapPin, Clock, Award, TrendingUp } from "lucide-react";

interface Contract {
  id: string;
  client: string;
  programme: string;
  role: string;
  startDate: string;
  endDate: string;
  days: number;
  rate: string;
  status: "active" | "upcoming" | "completed";
}

const CONTRACTS: Contract[] = [
  { id:"1", client:"Bytes Academy",   programme:"IT Support NQF3",    role:"Facilitator",  startDate:"15 Jan", endDate:"30 Nov", days:45, rate:"R1 800/day", status:"active"    },
  { id:"2", client:"TIH Training",    programme:"Data Analytics NQF4", role:"Assessor",    startDate:"01 Feb", endDate:"28 Feb", days:8,  rate:"R2 200/day", status:"upcoming"  },
  { id:"3", client:"Empower SA",      programme:"Management NQF4",    role:"Facilitator",  startDate:"Sep 24", endDate:"Nov 24", days:32, rate:"R1 900/day", status:"completed" },
];

const reputationScore = 87;
const reputationLabel = reputationScore >= 90 ? "Elite" : reputationScore >= 75 ? "Trusted" : "Rising";
const reputationColor = reputationScore >= 90 ? "text-yellow-500" : reputationScore >= 75 ? "text-primary" : "text-muted-foreground";

const STATUS_CFG = {
  active:    "bg-emerald-500/10 text-emerald-600",
  upcoming:  "bg-primary/10 text-primary",
  completed: "bg-muted text-muted-foreground",
};

export function AvailabilityToggleWidget() {
  const [available,  setAvailable]  = useState(true);
  const [visibility, setVisibility] = useState<"public" | "sdp_only">("public");

  return (
    <div className="space-y-4">
      {/* Availability toggle — THE hero element */}
      <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${available ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-muted/30"}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full transition-colors ${available ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
              <p className="text-sm font-bold text-foreground">
                {available ? "Available for Work" : "Not Available"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {available ? "You appear in SDP search results" : "Hidden from all SDP searches"}
            </p>
          </div>
          <Switch checked={available} onCheckedChange={setAvailable} className="data-[state=checked]:bg-emerald-500" />
        </div>

        {available && (
          <div className="mt-3 flex gap-2">
            {(["public", "sdp_only"] as const).map(v => (
              <button
                key={v}
                onClick={() => setVisibility(v)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${visibility === v ? "bg-emerald-500 text-white border-emerald-500" : "border-border text-muted-foreground"}`}
              >
                {v === "public" ? "🌍 Fully Public" : "🔒 SDPs Only"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reputation Score */}
      <div className="p-3 rounded-xl bg-muted/30 border border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <p className="text-xs font-semibold text-foreground">Reputation Score</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-xl font-black ${reputationColor}`}>{reputationScore}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${reputationColor} bg-muted`}>{reputationLabel}</span>
          </div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-yellow-500 transition-all duration-700" style={{ width: `${reputationScore}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          {[
            { label:"Learner Feedback", val:"4.7★" },
            { label:"Pass Rate",        val:"91%" },
            { label:"Contracts Done",   val:"7" },
          ].map(s => (
            <div key={s.label} className="rounded-lg bg-card border border-border p-2">
              <p className="text-xs font-bold text-foreground">{s.val}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active contracts */}
      <div>
        <p className="text-xs font-semibold text-foreground mb-2">My Contracts</p>
        <div className="space-y-2">
          {CONTRACTS.map(c => (
            <div key={c.id} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Award className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-foreground truncate">{c.client}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize ${STATUS_CFG[c.status]}`}>{c.status}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{c.programme} · {c.role}</p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{c.startDate} – {c.endDate}</span>
                  <span className="font-semibold text-foreground">{c.rate}</span>
                  <span>{c.days} days</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
