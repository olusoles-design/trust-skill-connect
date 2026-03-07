import { useAuth } from "@/contexts/AuthContext";
import { Bell, ChevronDown, Eye, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import type { AppRole } from "@/lib/permissions";

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

const ROLE_LABELS: Record<AppRole, string> = {
  learner:          "Learner",
  practitioner:     "Practitioner",
  employer:         "Employer",
  support_provider: "Support Provider",
  provider:         "Skills Dev Provider",
  sponsor:          "Sponsor",
  fundi:            "Fundi",
  admin:            "Admin",
  seta:             "SETA",
  government:       "Government",
};

export function DashboardHeader() {
  const { user, role, allRoles, switchRole, previewRole, previewingAs, persona, plan, isTrialActive } = useAuth();
  const navigate = useNavigate();

  const personaInfo = persona ? PERSONA_LABELS[persona] : null;
  const planLabel = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "Starter";
  const hasMultipleRoles = allRoles.length > 1;
  const isAdmin = allRoles.includes("admin");

  const handleExitPreview = () => {
    previewRole(null);
    navigate("/dashboard/admin");
  };

  return (
    <div className="flex flex-col w-full gap-0">
      {/* Admin preview banner */}
      {isAdmin && previewingAs && (
        <div className="flex items-center justify-between bg-destructive/10 border-b border-destructive/20 px-4 py-1.5 -mx-4 -mt-0 mb-1">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-destructive" />
            <span className="text-xs font-semibold text-destructive">
              Admin Preview — {ROLE_LABELS[previewingAs]}
            </span>
          </div>
          <button
            onClick={handleExitPreview}
            className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 font-medium transition-colors"
          >
            <X className="w-3 h-3" /> Exit Preview
          </button>
        </div>
      )}

      <div className="flex items-center justify-between w-full">
        {/* Left: persona badge + role switcher */}
        <div className="flex items-center gap-2">
          {personaInfo && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${personaInfo.color}`}>
              {personaInfo.label}
            </span>
          )}

          {hasMultipleRoles ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors capitalize hidden sm:flex">
                  {role ? ROLE_LABELS[role] : "Select Role"}
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Switch Active Role</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allRoles.map((r) => (
                  <DropdownMenuItem
                    key={r}
                    onClick={() => switchRole(r)}
                    className={`text-sm capitalize cursor-pointer ${r === role && !previewingAs ? "font-semibold text-primary" : ""}`}
                  >
                    {ROLE_LABELS[r]}
                    {r === role && !previewingAs && <span className="ml-auto text-primary text-xs">Active</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span className="text-sm text-muted-foreground capitalize hidden sm:block">
              {role ? ROLE_LABELS[role] : "Guest"}
            </span>
          )}
        </div>

        {/* Right: plan badge + notifications + avatar */}
        <div className="flex items-center gap-3 ml-auto">
          {isTrialActive && (
            <span className="text-xs text-gold font-medium hidden sm:block">Trial active</span>
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
    </div>
  );
}
