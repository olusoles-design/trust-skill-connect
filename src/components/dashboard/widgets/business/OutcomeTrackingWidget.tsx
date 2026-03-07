import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Award, Briefcase, Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Programme {
  id: string;
  name: string;
  nqfLevel: number;
  cohort: string;
  enrolled: number;
  passed: number;
  employed: number;
  seta: string;
}

const PROGRAMMES: Programme[] = [
  { id:"1", name:"IT Support NQF3",       nqfLevel:3, cohort:"Jan–Nov 2024", enrolled:24, passed:22, employed:17, seta:"MICT SETA" },
  { id:"2", name:"Data Analytics NQF4",   nqfLevel:4, cohort:"Jul–Jun 2024", enrolled:16, passed:15, employed:13, seta:"MICT SETA" },
  { id:"3", name:"Business Admin NQF3",   nqfLevel:3, cohort:"Jan–Nov 2024", enrolled:30, passed:27, employed:18, seta:"SERVICES SETA" },
  { id:"4", name:"Management NQF4",       nqfLevel:4, cohort:"Jan–Nov 2024", enrolled:12, passed:11, employed:10, seta:"SERVICES SETA" },
  { id:"5", name:"Customer Service NQF3", nqfLevel:3, cohort:"Jul–Jun 2023", enrolled:20, passed:19, employed:14, seta:"W&RSETA" },
];

const chartData = PROGRAMMES.map(p => ({
  name: p.name.split(" ").slice(0, 2).join(" "),
  passRate: Math.round((p.passed / p.enrolled) * 100),
  absRate:  Math.round((p.employed / p.passed) * 100),
}));

const COLORS_PASS = ["#16a34a", "#16a34a", "#16a34a", "#16a34a", "#16a34a"];
const COLORS_ABS  = ["hsl(var(--primary))", "hsl(var(--primary))", "hsl(var(--primary))", "hsl(var(--primary))", "hsl(var(--primary))"];

const totalEnrolled  = PROGRAMMES.reduce((s, p) => s + p.enrolled, 0);
const totalPassed    = PROGRAMMES.reduce((s, p) => s + p.passed, 0);
const totalEmployed  = PROGRAMMES.reduce((s, p) => s + p.employed, 0);
const overallPass    = Math.round((totalPassed / totalEnrolled) * 100);
const overallAbsorb  = Math.round((totalEmployed / totalPassed) * 100);

export function OutcomeTrackingWidget() {
  const [view, setView] = useState<"overview" | "programmes">("overview");

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
        {(["overview","programmes"] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {v}
          </button>
        ))}
      </div>

      {view === "overview" ? (
        <div className="space-y-4">
          {/* KPI headline */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-muted/40 border border-border text-center">
              <p className="text-2xl font-black text-foreground">{totalEnrolled}</p>
              <p className="text-[10px] text-muted-foreground">Total Enrolled</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <p className="text-2xl font-black text-emerald-600">{overallPass}%</p>
              <p className="text-[10px] text-emerald-600/70">Pass Rate</p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-center">
              <p className="text-2xl font-black text-primary">{overallAbsorb}%</p>
              <p className="text-[10px] text-primary/70">Employment Abs.</p>
            </div>
          </div>

          {/* Marketing callout */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-sm font-bold text-foreground mb-1">Your performance profile</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our learners achieve a <strong className="text-emerald-600">{overallPass}% pass rate</strong> and{" "}
              <strong className="text-primary">{overallAbsorb}% employment absorption rate</strong> across {PROGRAMMES.length} active programmes — 
              verified outcomes that Sponsors can trust.
            </p>
          </div>

          {/* Dual-bar chart */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-3">Pass vs Employment Absorption by Programme</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} barGap={2} barSize={12}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  formatter={(v: number, name: string) => [`${v}%`, name === "passRate" ? "Pass Rate" : "Employment"]}
                />
                <Bar dataKey="passRate" radius={[4,4,0,0]}>
                  {chartData.map((_, i) => <Cell key={i} fill="#16a34a" />)}
                </Bar>
                <Bar dataKey="absRate" radius={[4,4,0,0]}>
                  {chartData.map((_, i) => <Cell key={i} fill="hsl(var(--primary))" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 justify-center text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Pass Rate</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" />Employment</span>
            </div>
          </div>

          <button
            onClick={() => toast.success("Outcome report exported")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted/50 transition-all"
          >
            <Upload className="w-3.5 h-3.5" /> Export Outcomes for Sponsors
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {PROGRAMMES.map(p => (
            <div key={p.id} className="p-3 rounded-xl border border-border bg-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-foreground">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{p.seta} · {p.cohort}</p>
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">NQF {p.nqfLevel}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div>
                  <p className="text-sm font-bold text-foreground">{p.enrolled}</p>
                  <p className="text-[10px] text-muted-foreground">Enrolled</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-600">{Math.round((p.passed/p.enrolled)*100)}%</p>
                  <p className="text-[10px] text-muted-foreground">Pass Rate</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">{Math.round((p.employed/p.passed)*100)}%</p>
                  <p className="text-[10px] text-muted-foreground">Employed</p>
                </div>
              </div>
              <button
                onClick={() => toast.success(`Results uploaded for ${p.name}`)}
                className="mt-2 flex items-center gap-1.5 text-[10px] text-primary hover:underline"
              >
                <Upload className="w-3 h-3" /> Upload Latest Results
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
