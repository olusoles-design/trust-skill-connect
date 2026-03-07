import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import type { AppRole } from "@/lib/permissions";
import {
  GraduationCap, Briefcase, Building2, ShieldCheck,
  UserCog, Scale, Landmark, Zap, BadgeDollarSign,
  Star, Eye, ArrowRight,
} from "lucide-react";

interface RoleMeta {
  label: string;
  description: string;
  persona: string;
  icon: React.ElementType;
  personaColor: string;
  bg: string;
}

const ROLE_META: Record<AppRole, RoleMeta> = {
  learner: {
    label: "Learner",
    description: "Browse opportunities, track applications and manage CV",
    persona: "Talent Hub",
    icon: GraduationCap,
    personaColor: "text-teal-600",
    bg: "bg-teal-500/10 border-teal-500/20",
  },
  practitioner: {
    label: "Practitioner",
    description: "Facilitator, Assessor, Moderator & SDF availability + credentials",
    persona: "Talent Hub",
    icon: UserCog,
    personaColor: "text-teal-600",
    bg: "bg-teal-500/10 border-teal-500/20",
  },
  fundi: {
    label: "Fundi",
    description: "Micro-task board, skill tasks and gig income tracking",
    persona: "Talent Hub",
    icon: Zap,
    personaColor: "text-teal-600",
    bg: "bg-teal-500/10 border-teal-500/20",
  },
  employer: {
    label: "Employer",
    description: "Post opportunities, manage learner pipeline and B-BBEE simulator",
    persona: "Business Hub",
    icon: Briefcase,
    personaColor: "text-primary",
    bg: "bg-primary/10 border-primary/20",
  },
  sponsor: {
    label: "Sponsor",
    description: "Fund learners, track ROI, allocate skills dev spend",
    persona: "Funding Hub",
    icon: BadgeDollarSign,
    personaColor: "text-accent-foreground",
    bg: "bg-accent/20 border-accent/30",
  },
  provider: {
    label: "Skills Dev Provider",
    description: "Tender feed, learner recruitment, outcome tracking & procurement",
    persona: "Business Hub",
    icon: Building2,
    personaColor: "text-primary",
    bg: "bg-primary/10 border-primary/20",
  },
  support_provider: {
    label: "Support Provider",
    description: "Procurement alerts, RFQ board and facility booking calendar",
    persona: "Business Hub",
    icon: Star,
    personaColor: "text-primary",
    bg: "bg-primary/10 border-primary/20",
  },
  seta: {
    label: "SETA",
    description: "Verification queue, SETA reporting and compliance monitoring",
    persona: "Oversight Hub",
    icon: ShieldCheck,
    personaColor: "text-secondary",
    bg: "bg-secondary/10 border-secondary/20",
  },
  government: {
    label: "Government",
    description: "National skills analytics, policy compliance and spend reporting",
    persona: "Oversight Hub",
    icon: Landmark,
    personaColor: "text-secondary",
    bg: "bg-secondary/10 border-secondary/20",
  },
  admin: {
    label: "Platform Admin",
    description: "Full platform administration, users, content moderation and settings",
    persona: "Oversight Hub",
    icon: Scale,
    personaColor: "text-secondary",
    bg: "bg-secondary/10 border-secondary/20",
  },
};

const PERSONA_ORDER: Record<string, AppRole[]> = {
  "Talent Hub":    ["learner", "practitioner", "fundi"],
  "Business Hub":  ["employer", "provider", "support_provider"],
  "Funding Hub":   ["sponsor"],
  "Oversight Hub": ["seta", "government", "admin"],
};

export function PortalSwitcherWidget() {
  const { previewRole, previewingAs, allRoles } = useAuth();
  const navigate = useNavigate();

  const isAdmin = allRoles.includes("admin");
  if (!isAdmin) return null;

  const handlePreview = (role: AppRole) => {
    previewRole(role);
    navigate("/dashboard");
  };

  const handleExitPreview = () => {
    previewRole(null);
    navigate("/dashboard");
  };

  return (
    <div className="space-y-6">
      {/* Active preview banner */}
      {previewingAs && (
        <div className="flex items-center justify-between rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">
              Previewing as: <strong>{ROLE_META[previewingAs]?.label}</strong>
            </span>
          </div>
          <button
            onClick={handleExitPreview}
            className="text-xs font-semibold text-destructive border border-destructive/40 rounded-lg px-3 py-1.5 hover:bg-destructive/10 transition-colors"
          >
            Exit Preview
          </button>
        </div>
      )}

      {Object.entries(PERSONA_ORDER).map(([persona, roles]) => (
        <div key={persona}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
            {persona}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {roles.map((roleKey) => {
              const meta = ROLE_META[roleKey];
              const Icon = meta.icon;
              const isActive = previewingAs === roleKey;

              return (
                <button
                  key={roleKey}
                  onClick={() => isActive ? handleExitPreview() : handlePreview(roleKey)}
                  className={`group relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all hover:shadow-md ${
                    isActive
                      ? "ring-2 ring-primary bg-primary/5 border-primary/30"
                      : `${meta.bg} hover:border-primary/30`
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-background/60 flex items-center justify-center">
                        <Icon className={`w-4 h-4 ${meta.personaColor}`} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{meta.label}</p>
                        <p className={`text-[10px] font-medium ${meta.personaColor}`}>{meta.persona}</p>
                      </div>
                    </div>
                    {isActive ? (
                      <span className="text-[10px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {meta.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
