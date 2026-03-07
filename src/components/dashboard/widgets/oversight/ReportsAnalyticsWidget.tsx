import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Download, TrendingUp, Users, Briefcase } from "lucide-react";

const MONTHLY = [
  { month:"Jun", learners:18, placements:4 },
  { month:"Jul", learners:24, placements:7 },
  { month:"Aug", learners:21, placements:9 },
  { month:"Sep", learners:35, placements:12 },
  { month:"Oct", learners:42, placements:16 },
  { month:"Nov", learners:38, placements:14 },
];

const KPIS = [
  { label:"Total Learners",    value:"158",    trend:"+12%",  icon:Users,       color:"text-primary" },
  { label:"Placed This Month", value:"14",     trend:"+3",    icon:Briefcase,   color:"text-green-600" },
  { label:"Completion Rate",   value:"74%",    trend:"+4pp",  icon:TrendingUp,  color:"text-primary" },
  { label:"Avg. Stipend",      value:"R4 600", trend:"Stable",icon:TrendingUp,  color:"text-muted-foreground" },
];

export function ReportsAnalyticsWidget() {
  return (
    <div className="space-y-5">
      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {KPIS.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-xl bg-muted/40 border border-border p-4">
              <div className="flex items-center justify-between mb-1">
                <Icon className={`w-4 h-4 ${kpi.color}`} />
                <span className="text-xs text-primary font-medium">{kpi.trend}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Learner enrolments bar chart */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground">Monthly Enrolments</p>
            <button className="flex items-center gap-1 text-xs text-primary hover:underline">
              <Download className="w-3 h-3" /> Export
            </button>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={MONTHLY}>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background:"hsl(var(--card))", border:"1px solid hsl(var(--border))", borderRadius:"8px", fontSize:11 }} />
              <Bar dataKey="learners" fill="hsl(var(--primary))" radius={[4,4,0,0]} name="Learners" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Placements trend line chart */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground">Placements Trend</p>
            <button className="flex items-center gap-1 text-xs text-primary hover:underline">
              <Download className="w-3 h-3" /> Export
            </button>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={MONTHLY}>
              <XAxis dataKey="month" tick={{ fontSize:10, fill:"hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background:"hsl(var(--card))", border:"1px solid hsl(var(--border))", borderRadius:"8px", fontSize:11 }} />
              <Line type="monotone" dataKey="placements" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill:"hsl(var(--primary))", r:3 }} name="Placements" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick exports */}
      <div className="flex flex-wrap gap-2">
        {["SETA WSP Report","SARS ETI Report","B-BBEE Summary","ATR Report","Placement Report"].map(r => (
          <button key={r} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
            <Download className="w-3 h-3" /> {r}
          </button>
        ))}
      </div>
    </div>
  );
}
