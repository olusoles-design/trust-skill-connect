import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Search, Send, FileText, Briefcase, Users,
  DollarSign, BadgeCheck, BarChart3, Store, Crosshair, ShieldCheck,
} from "lucide-react";
import type { Capability } from "@/lib/permissions";

interface WidgetDef {
  capability: Capability;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;         // tailwind bg utility from design system
  accentColor: string;   // tailwind text utility
  comingSoon?: boolean;
}

const WIDGETS: WidgetDef[] = [
  {
    capability: "find_opportunities",
    title: "Browse Opportunities",
    description: "Discover learnerships, jobs, gigs and programmes matched to your profile.",
    icon: Search,
    color: "bg-primary/10",
    accentColor: "text-primary",
  },
  {
    capability: "apply_for_opportunities",
    title: "My Applications",
    description: "Track the status of your submitted applications and bids in one place.",
    icon: Send,
    color: "bg-teal/10",
    accentColor: "text-teal",
  },
  {
    capability: "build_profile",
    title: "Profile & Digital CV",
    description: "Build a verified professional profile and exportable digital CV.",
    icon: FileText,
    color: "bg-secondary/10",
    accentColor: "text-secondary",
  },
  {
    capability: "post_opportunities",
    title: "Post Opportunities",
    description: "Publish jobs, learnerships, apprenticeships and skills programmes.",
    icon: Briefcase,
    color: "bg-primary/10",
    accentColor: "text-primary",
  },
  {
    capability: "manage_learners",
    title: "Learner Management",
    description: "Onboard learners, track progress, manage intake and outcomes reporting.",
    icon: Users,
    color: "bg-teal/10",
    accentColor: "text-teal",
  },
  {
    capability: "fund_learners",
    title: "Fund Learners",
    description: "Sponsor and finance skills development. Calculate B-BBEE tax incentives.",
    icon: DollarSign,
    color: "bg-accent/20",
    accentColor: "text-accent-foreground",
  },
  {
    capability: "verify_documents",
    title: "Document Verification",
    description: "Compliance checks, credential verification and digital audit trails.",
    icon: BadgeCheck,
    color: "bg-primary/10",
    accentColor: "text-primary",
  },
  {
    capability: "view_reports",
    title: "Reports & Analytics",
    description: "SETA, SARS, B-BBEE and operational dashboards with exportable data.",
    icon: BarChart3,
    color: "bg-secondary/10",
    accentColor: "text-secondary",
  },
  {
    capability: "marketplace_listing",
    title: "Marketplace Listing",
    description: "List your services in the SkillsMark support provider marketplace.",
    icon: Store,
    color: "bg-teal/10",
    accentColor: "text-teal",
  },
  {
    capability: "tender_matching",
    title: "Tender Matching",
    description: "Get matched to government and corporate tenders relevant to your expertise.",
    icon: Crosshair,
    color: "bg-accent/20",
    accentColor: "text-accent-foreground",
  },
  {
    capability: "platform_admin",
    title: "Platform Administration",
    description: "Full platform oversight: users, content, compliance and system settings.",
    icon: ShieldCheck,
    color: "bg-destructive/10",
    accentColor: "text-destructive",
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function WidgetGrid() {
  const { capabilities, persona, role } = useAuth();

  const visibleWidgets = WIDGETS.filter((w) => capabilities.includes(w.capability));

  const PERSONA_TITLES: Record<string, string> = {
    talent:    "Talent Hub",
    business:  "Business Hub",
    funding:   "Funding Hub",
    oversight: "Oversight Hub",
  };

  const hubTitle = persona ? PERSONA_TITLES[persona] : "My Portal";

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-xl gradient-hero p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-primary-foreground">
            Welcome to your {hubTitle}
          </h1>
          <p className="text-sm text-primary-foreground/70 mt-1 capitalize">
            {role?.replace("_", " ")} &middot; {visibleWidgets.length} features available
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {capabilities.slice(0, 3).map((cap) => (
            <span
              key={cap}
              className="text-xs px-2.5 py-1 rounded-full bg-primary-foreground/10 text-primary-foreground/80 border border-primary-foreground/20 capitalize"
            >
              {cap.replace(/_/g, " ")}
            </span>
          ))}
          {capabilities.length > 3 && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary-foreground/10 text-primary-foreground/60 border border-primary-foreground/20">
              +{capabilities.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Widget grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {visibleWidgets.map((widget) => (
          <WidgetCard key={widget.capability} widget={widget} />
        ))}
      </motion.div>
    </div>
  );
}

function WidgetCard({ widget }: { widget: WidgetDef }) {
  const Icon = widget.icon;
  return (
    <motion.div
      variants={itemVariants}
      className="group rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg ${widget.color} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${widget.accentColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-card-foreground">{widget.title}</h3>
            {widget.comingSoon && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                Soon
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{widget.description}</p>
        </div>
      </div>

      {/* Coming soon placeholder bar */}
      <div className="mt-4 rounded-lg bg-muted/50 h-20 flex items-center justify-center border border-dashed border-border/60">
        <p className="text-xs text-muted-foreground/60 font-medium">Widget content — coming soon</p>
      </div>

      <div className="mt-3 flex justify-end">
        <span className={`text-xs font-medium ${widget.accentColor} group-hover:underline`}>
          Open →
        </span>
      </div>
    </motion.div>
  );
}
