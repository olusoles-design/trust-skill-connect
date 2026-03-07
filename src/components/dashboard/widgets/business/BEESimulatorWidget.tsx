import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { TrendingUp, Info, ChevronRight } from "lucide-react";

// B-BBEE Skills Development element: 20 points (6% of payroll target)
// Source: DTIC Generic Scorecard

interface Level { level: number; label: string; color: string; min: number; }
const LEVELS: Level[] = [
  { level: 1, label: "Level 1", color: "text-emerald-600",  min: 100 },
  { level: 2, label: "Level 2", color: "text-emerald-500",  min: 95  },
  { level: 3, label: "Level 3", color: "text-yellow-600",   min: 90  },
  { level: 4, label: "Level 4", color: "text-yellow-500",   min: 80  },
  { level: 5, label: "Level 5", color: "text-orange-500",   min: 75  },
  { level: 6, label: "Level 6", color: "text-orange-600",   min: 70  },
  { level: 7, label: "Level 7", color: "text-destructive",  min: 55  },
  { level: 8, label: "Level 8", color: "text-destructive",  min: 40  },
];

function scoreToBBEELevel(score: number) {
  for (const l of LEVELS) if (score >= l.min) return l;
  return { level: 9, label: "Non-Compliant", color: "text-muted-foreground", min: 0 };
}

export function BEESimulatorWidget() {
  const [payroll,  setPayroll]  = useState(5_000_000);   // R5M annual payroll
  const [spend,    setSpend]    = useState(150_000);      // current training spend
  const [learners, setLearners] = useState(8);            // learners on programme

  // Skills Development element calculation (simplified Generic Scorecard)
  const targetSpend  = payroll * 0.06;
  const sdPoints     = Math.min(20, (spend / targetSpend) * 20);
  const learnPoints  = Math.min(5, learners * 0.4);       // bonus points for learnerships
  const totalSD      = sdPoints + learnPoints;
  const sdPct        = Math.min(100, (totalSD / 25) * 100);

  // Simulated total scorecard (SD contributes ~25 of ~110 total weighted points → ~23%)
  const totalScore = Math.min(100, 60 + sdPct * 0.4);
  const current    = scoreToBBEELevel(totalScore);

  // Projected: add R50k more spend
  const projectedSpend  = spend + 50_000;
  const projSDPts       = Math.min(20, (projectedSpend / targetSpend) * 20);
  const projTotal       = Math.min(100, 60 + (Math.min(100, ((projSDPts + learnPoints) / 25) * 100)) * 0.4);
  const projected       = scoreToBBEELevel(projTotal);

  const fmt = (n: number) => `R${(n / 1_000_000).toFixed(2)}M`;
  const fmtK = (n: number) => n >= 1_000_000 ? `R${(n/1_000_000).toFixed(1)}M` : `R${(n/1_000).toFixed(0)}k`;

  return (
    <div className="space-y-5">
      {/* Current vs Projected */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-muted/40 border border-border text-center">
          <p className="text-xs text-muted-foreground mb-1">Current Level</p>
          <p className={`text-3xl font-black ${current.color}`}>{current.level}</p>
          <p className="text-xs text-muted-foreground mt-1">{current.label}</p>
          <p className="text-xs font-semibold text-foreground mt-1">{totalScore.toFixed(0)} pts</p>
        </div>
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
          <p className="text-xs text-muted-foreground mb-1">+R50k Spend</p>
          <p className={`text-3xl font-black ${projected.color}`}>{projected.level}</p>
          <p className="text-xs text-muted-foreground mt-1">{projected.label}</p>
          <p className="text-xs font-semibold text-primary mt-1">{projTotal.toFixed(0)} pts</p>
        </div>
      </div>

      {/* Skills Dev points bar */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <p className="text-xs font-medium text-foreground">Skills Development Score</p>
          <span className="text-xs font-bold text-primary">{totalSD.toFixed(1)} / 25 pts</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${(totalSD / 25) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
          <span>Training spend: {sdPoints.toFixed(1)} pts</span>
          <span>Learnership bonus: {learnPoints.toFixed(1)} pts</span>
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        {/* Payroll */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Annual Payroll</span>
            <span className="font-semibold text-foreground">{fmt(payroll)}</span>
          </div>
          <Slider
            min={1_000_000} max={50_000_000} step={500_000}
            value={[payroll]}
            onValueChange={([v]) => setPayroll(v)}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>R1M</span><span>R25M</span><span>R50M</span>
          </div>
        </div>

        {/* Training Spend */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Annual Training Spend</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{fmtK(spend)}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${spend >= targetSpend ? "bg-emerald-500/15 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
                {((spend / targetSpend) * 100).toFixed(0)}% of target
              </span>
            </div>
          </div>
          <Slider
            min={0} max={Math.min(payroll * 0.12, 2_000_000)} step={10_000}
            value={[spend]}
            onValueChange={([v]) => setSpend(v)}
            className="w-full"
          />
          <p className="text-[10px] text-muted-foreground">Target: {fmtK(targetSpend)} (6% of payroll)</p>
        </div>

        {/* Learners */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Learnership Headcount</span>
            <span className="font-semibold text-foreground">{learners} learners</span>
          </div>
          <Slider
            min={0} max={50} step={1}
            value={[learners]}
            onValueChange={([v]) => setLearners(v)}
            className="w-full"
          />
        </div>
      </div>

      {/* Insight callout */}
      {projected.level < current.level && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <TrendingUp className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-foreground">
            Spend <strong className="text-primary">R50k more</strong> to move from{" "}
            <strong>{current.label}</strong> to <strong className={projected.color}>{projected.label}</strong>.
            This unlocks better procurement preferencing and improved stakeholder trust.
          </p>
        </div>
      )}
      {projected.level >= current.level && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 border border-border">
          <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            You're on track. Increase learnerships or spend to unlock bonus points.
          </p>
        </div>
      )}
    </div>
  );
}
