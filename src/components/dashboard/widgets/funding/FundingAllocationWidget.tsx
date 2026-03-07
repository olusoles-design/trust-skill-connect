import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Users, DollarSign } from "lucide-react";

const ALLOCATION = [
  { name: "IT Skills",    budget: 250000, spent: 187000 },
  { name: "Construction", budget: 180000, spent: 165000 },
  { name: "Healthcare",   budget: 120000, spent: 44000 },
  { name: "Agri",         budget: 90000,  spent: 90000 },
  { name: "Finance",      budget: 160000, spent: 98000 },
];

const RECENT_PAYMENTS = [
  { name: "Aisha Khumalo",  amount: "R5 200", programme: "IT Learnership", date: "1 Nov" },
  { name: "Sipho Ndlovu",   amount: "R4 200", programme: "IT Learnership", date: "1 Nov" },
  { name: "Zanele Mokoena", amount: "R5 500", programme: "Data Analytics", date: "1 Nov" },
  { name: "Thabo Dlamini",  amount: "R3 800", programme: "Business Admin",  date: "1 Nov" },
];

const totalBudget = ALLOCATION.reduce((s, a) => s + a.budget, 0);
const totalSpent  = ALLOCATION.reduce((s, a) => s + a.spent,  0);
const pct = Math.round((totalSpent / totalBudget) * 100);

export function FundingAllocationWidget() {
  return (
    <div className="space-y-5">
      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-muted/40 border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total Budget</span>
          </div>
          <p className="text-xl font-bold text-foreground">R{(totalBudget/1000).toFixed(0)}k</p>
        </div>
        <div className="rounded-xl bg-muted/40 border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Disbursed</span>
          </div>
          <p className="text-xl font-bold text-foreground">R{(totalSpent/1000).toFixed(0)}k</p>
          <p className="text-xs text-primary mt-0.5">{pct}% of budget</p>
        </div>
        <div className="rounded-xl bg-muted/40 border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Learners Funded</span>
          </div>
          <p className="text-xl font-bold text-foreground">23</p>
          <p className="text-xs text-primary mt-0.5">+3 this month</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-3">Budget vs Spend by Sector</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={ALLOCATION} barGap={4}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 11 }}
              formatter={(v: number) => [`R${(v/1000).toFixed(0)}k`]}
            />
            <Bar dataKey="budget" fill="hsl(var(--muted))" radius={[4,4,0,0]} name="Budget" />
            <Bar dataKey="spent" radius={[4,4,0,0]} name="Spent">
              {ALLOCATION.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.spent / entry.budget > 0.9 ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent disbursements */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Recent Stipend Payments</p>
        <div className="space-y-1.5">
          {RECENT_PAYMENTS.map(p => (
            <div key={p.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 border border-border">
              <div>
                <p className="text-xs font-semibold text-foreground">{p.name}</p>
                <p className="text-[10px] text-muted-foreground">{p.programme}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-primary">{p.amount}</p>
                <p className="text-[10px] text-muted-foreground">{p.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
