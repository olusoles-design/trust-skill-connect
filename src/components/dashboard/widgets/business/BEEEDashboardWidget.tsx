import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

const PILLARS = [
  { pillar: "Ownership", score: 10, max: 25, weight: 25 },
  { pillar: "Management Control", score: 8, max: 15, weight: 15 },
  { pillar: "Skills Development", score: 12, max: 20, weight: 20 },
  { pillar: "Enterprise Dev", score: 11, max: 15, weight: 15 },
  { pillar: "Supplier Dev", score: 14, max: 20, weight: 20 },
  { pillar: "Community Dev", score: 3, max: 5, weight: 5 },
];

const radarData = PILLARS.map(p => ({
  subject: p.pillar.split(" ")[0],
  score: (p.score / p.max) * 100,
  fullMark: 100,
}));

const totalScore = PILLARS.reduce((s, p) => s + p.score, 0);

function getLevel(score: number) {
  if (score >= 100) return { level: "Level 1", color: "text-green-600", bg: "bg-green-500/15" };
  if (score >= 85)  return { level: "Level 2", color: "text-green-600", bg: "bg-green-500/15" };
  if (score >= 75)  return { level: "Level 3", color: "text-primary", bg: "bg-primary/15" };
  if (score >= 65)  return { level: "Level 4", color: "text-primary", bg: "bg-primary/15" };
  if (score >= 55)  return { level: "Level 5", color: "text-accent-foreground", bg: "bg-accent/20" };
  if (score >= 45)  return { level: "Level 6", color: "text-accent-foreground", bg: "bg-accent/20" };
  return { level: "Level 7+", color: "text-destructive", bg: "bg-destructive/10" };
}

const { level, color, bg } = getLevel(totalScore);

export function BEEEDashboardWidget() {
  return (
    <div className="space-y-4">
      {/* Score overview */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 rounded-xl border border-border bg-muted/30 p-5 flex items-center gap-4">
          <div className={`w-16 h-16 rounded-full ${bg} flex flex-col items-center justify-center flex-shrink-0`}>
            <span className={`text-2xl font-bold ${color}`}>{totalScore}</span>
            <span className="text-[10px] text-muted-foreground">/ 100</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Current B-BBEE Level</p>
            <p className={`text-2xl font-bold ${color}`}>{level}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Updated: Jan 2025</p>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-2">
          {[
            { label: "ETI Benefit",    value: "R180 000", trend: "+12%" },
            { label: "Learners Funded", value: "23",       trend: "+3" },
            { label: "Sec 12H Claim",  value: "R95 000",  trend: "Eligible" },
            { label: "Skills Spend",   value: "R620 000", trend: "74% target" },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-xl bg-card border border-border p-3">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="text-base font-bold text-foreground mt-0.5">{kpi.value}</p>
              <p className="text-xs text-primary">{kpi.trend}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Radar chart */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-3">Scorecard Breakdown</p>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 11 }}
              formatter={(v: number) => [`${Math.round(v)}%`, "Score"]}
            />
            <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Pillar table */}
      <div className="space-y-2">
        {PILLARS.map(p => (
          <div key={p.pillar} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-36 flex-shrink-0 truncate">{p.pillar}</span>
            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(p.score / p.max) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-foreground w-12 text-right flex-shrink-0">{p.score}/{p.max}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
