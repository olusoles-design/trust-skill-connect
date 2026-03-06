import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";

const PERSONA_LABELS: Record<string, { label: string; color: string }> = {
  talent:   { label: "Talent Hub",   color: "bg-teal/10 text-teal border-teal/20" },
  business: { label: "Business Hub", color: "bg-primary/10 text-primary border-primary/20" },
  funding:  { label: "Funding Hub",  color: "bg-accent/10 text-accent-foreground border-accent/30" },
  oversight:{ label: "Oversight Hub",color: "bg-secondary/10 text-secondary border-secondary/20" },
};

const PLAN_COLORS: Record<string, string> = {
  starter:      "bg-muted text-muted-foreground",
  professional: "bg-primary/10 text-primary",
  enterprise:   "bg-accent/20 text-accent-foreground",
};

export function DashboardHeader() {
  const { user, role, persona, plan, isTrialActive } = useAuth();

  const personaInfo = persona ? PERSONA_LABELS[persona] : null;
  const planLabel = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "Starter";

  return (
    <div className="flex items-center justify-between w-full">
      {/* Left: page context */}
      <div className="flex items-center gap-3">
        {personaInfo && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${personaInfo.color}`}>
            {personaInfo.label}
          </span>
        )}
        <span className="text-sm text-muted-foreground capitalize hidden sm:block">
          {role?.replace("_", " ") ?? "Guest"}
        </span>
      </div>

      {/* Right: plan badge + notifications + user avatar */}
      <div className="flex items-center gap-3 ml-auto">
        {isTrialActive && (
          <span className="text-xs text-gold font-medium hidden sm:block">
            Trial active
          </span>
        )}
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${PLAN_COLORS[plan ?? "starter"]}`}>
          {planLabel}
        </span>

        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
        </button>

        <div className="w-8 h-8 rounded-full gradient-teal flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
          {user?.email?.[0]?.toUpperCase() ?? "U"}
        </div>
      </div>
    </div>
  );
}
