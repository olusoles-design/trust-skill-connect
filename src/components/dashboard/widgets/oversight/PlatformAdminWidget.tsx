import { Users, ShieldCheck, Activity, AlertTriangle, Settings, Database, TrendingUp } from "lucide-react";

const SYSTEM_STATS = [
  { label:"Total Users",       value:"1,248",  trend:"+23 today",  icon:Users,      color:"text-primary" },
  { label:"Active Sessions",   value:"84",     trend:"Live",       icon:Activity,   color:"text-green-600" },
  { label:"Pending Verif.",    value:"12",     trend:"Action needed",icon:ShieldCheck,color:"text-destructive" },
  { label:"Open Tickets",      value:"7",      trend:"2 critical", icon:AlertTriangle,color:"text-accent-foreground" },
  { label:"DB Records",        value:"38.4k",  trend:"+124 today", icon:Database,   color:"text-primary" },
  { label:"Uptime",            value:"99.9%",  trend:"30d avg",    icon:TrendingUp, color:"text-green-600" },
];

const RECENT_ACTIVITY = [
  { action:"New user registered",       user:"nomvula.sithole@gmail.com",  role:"Learner",         time:"2m ago",  type:"success" },
  { action:"Verification approved",     user:"Bytes Academy",              role:"Provider",        time:"8m ago",  type:"success" },
  { action:"Failed login attempt",      user:"unknown@mail.com",           role:"—",               time:"14m ago", type:"warning" },
  { action:"Role change request",       user:"thabo.dlamini@corp.co.za",   role:"Employer → Admin",time:"25m ago", type:"info" },
  { action:"Content flagged",           user:"system",                     role:"Auto-mod",        time:"1h ago",  type:"warning" },
  { action:"Subscription upgraded",     user:"cape.digital@studio.co.za",  role:"Professional",    time:"2h ago",  type:"success" },
];

const activityTypeColor: Record<string, string> = {
  success: "bg-green-500/15 text-green-600",
  warning: "bg-destructive/10 text-destructive",
  info:    "bg-primary/10 text-primary",
};

export function PlatformAdminWidget() {
  return (
    <div className="space-y-5">
      {/* System stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {SYSTEM_STATS.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl bg-card border border-border p-3 text-center hover:bg-muted/30 transition-all cursor-pointer">
              <Icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{stat.label}</p>
              <p className={`text-[10px] mt-0.5 font-medium ${stat.color}`}>{stat.trend}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent activity log */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground">Live Activity Log</p>
          <div className="space-y-1.5">
            {RECENT_ACTIVITY.map((act, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${activityTypeColor[act.type]}`}>
                  {act.type.toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{act.action}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{act.user} · {act.role}</p>
                </div>
                <span className="text-[10px] text-muted-foreground/60 flex-shrink-0">{act.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground">Admin Actions</p>
          <div className="space-y-2">
            {[
              { label:"Manage Users",       icon:Users,       color:"text-primary", bg:"bg-primary/10" },
              { label:"Review Verifications",icon:ShieldCheck, color:"text-destructive", bg:"bg-destructive/10" },
              { label:"System Settings",    icon:Settings,    color:"text-muted-foreground", bg:"bg-muted" },
              { label:"Content Moderation", icon:AlertTriangle,color:"text-accent-foreground", bg:"bg-accent/20" },
              { label:"Database Backup",    icon:Database,    color:"text-primary", bg:"bg-primary/10" },
            ].map(action => {
              const Icon = action.icon;
              return (
                <button key={action.label} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-all text-left group">
                  <div className={`w-7 h-7 rounded-lg ${action.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-3.5 h-3.5 ${action.color}`} />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
