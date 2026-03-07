import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Send, FileText, Briefcase, Users,
  DollarSign, BadgeCheck, BarChart3, Store, Crosshair, ShieldCheck, ArrowLeft,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Capability } from "@/lib/permissions";
import { BrowseOpportunitiesWidget } from "./widgets/BrowseOpportunitiesWidget";

// ─── Widget registry ─────────────────────────────────────────────────────────

interface WidgetDef {
  capability: Capability;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  accentColor: string;
  persona: "talent" | "business" | "funding" | "oversight";
}

const WIDGETS: WidgetDef[] = [
  // Talent
  {
    capability: "find_opportunities",
    title: "Browse Opportunities",
    description: "Discover learnerships, jobs, gigs and programmes matched to your profile.",
    icon: Search,
    color: "bg-primary/10",
    accentColor: "text-primary",
    persona: "talent",
  },
  {
    capability: "apply_for_opportunities",
    title: "My Applications",
    description: "Track the status of your submitted applications and bids in one place.",
    icon: Send,
    color: "bg-primary/10",
    accentColor: "text-primary",
    persona: "talent",
  },
  {
    capability: "build_profile",
    title: "Profile & Digital CV",
    description: "Build a verified professional profile and exportable digital CV.",
    icon: FileText,
    color: "bg-primary/10",
    accentColor: "text-primary",
    persona: "talent",
  },
  // Business
  {
    capability: "post_opportunities",
    title: "Post Opportunities",
    description: "Publish jobs, learnerships, apprenticeships and skills programmes.",
    icon: Briefcase,
    color: "bg-accent/20",
    accentColor: "text-accent-foreground",
    persona: "business",
  },
  {
    capability: "manage_learners",
    title: "Learner Management",
    description: "Onboard learners, track progress, manage intake and outcomes reporting.",
    icon: Users,
    color: "bg-accent/20",
    accentColor: "text-accent-foreground",
    persona: "business",
  },
  {
    capability: "marketplace_listing",
    title: "Marketplace Listing",
    description: "List your services in the SkillsMark support provider marketplace.",
    icon: Store,
    color: "bg-accent/20",
    accentColor: "text-accent-foreground",
    persona: "business",
  },
  {
    capability: "tender_matching",
    title: "Tender Matching",
    description: "Get matched to government and corporate tenders relevant to your expertise.",
    icon: Crosshair,
    color: "bg-accent/20",
    accentColor: "text-accent-foreground",
    persona: "business",
  },
  // Funding
  {
    capability: "fund_learners",
    title: "Fund Learners",
    description: "Sponsor and finance skills development. Calculate B-BBEE tax incentives.",
    icon: DollarSign,
    color: "bg-secondary/10",
    accentColor: "text-secondary-foreground",
    persona: "funding",
  },
  // Oversight
  {
    capability: "verify_documents",
    title: "Document Verification",
    description: "Compliance checks, credential verification and digital audit trails.",
    icon: BadgeCheck,
    color: "bg-destructive/10",
    accentColor: "text-destructive",
    persona: "oversight",
  },
  {
    capability: "view_reports",
    title: "Reports & Analytics",
    description: "SETA, SARS, B-BBEE and operational dashboards with exportable data.",
    icon: BarChart3,
    color: "bg-destructive/10",
    accentColor: "text-destructive",
    persona: "oversight",
  },
  {
    capability: "platform_admin",
    title: "Platform Administration",
    description: "Full platform oversight: users, content, compliance and system settings.",
    icon: ShieldCheck,
    color: "bg-destructive/10",
    accentColor: "text-destructive",
    persona: "oversight",
  },
];

// ─── Persona hub config ───────────────────────────────────────────────────────

const PERSONA_HUB_CONFIG: Record<string, {
  label: string;
  gradient: string;
  badgeColor: string;
  welcomeText: string;
}> = {
  talent: {
    label: "Talent Hub",
    gradient: "from-primary/20 via-primary/10 to-transparent",
    badgeColor: "bg-primary/20 text-primary border-primary/30",
    welcomeText: "Find opportunities, build your profile and grow your career.",
  },
  business: {
    label: "Business Hub",
    gradient: "from-accent/20 via-accent/10 to-transparent",
    badgeColor: "bg-accent/30 text-accent-foreground border-accent/40",
    welcomeText: "Post opportunities, manage learners and grow your B-BBEE footprint.",
  },
  funding: {
    label: "Funding Hub",
    gradient: "from-secondary/20 via-secondary/10 to-transparent",
    badgeColor: "bg-secondary/20 text-secondary-foreground border-secondary/30",
    welcomeText: "Fund skills development and track your investment impact.",
  },
  oversight: {
    label: "Oversight Hub",
    gradient: "from-destructive/15 via-destructive/5 to-transparent",
    badgeColor: "bg-destructive/15 text-destructive border-destructive/30",
    welcomeText: "Verify credentials, enforce compliance and manage reporting.",
  },
};

// ─── Active widget view map ───────────────────────────────────────────────────

type ActiveView = Capability | null;

const WIDGET_COMPONENTS: Partial<Record<Capability, React.ComponentType>> = {
  find_opportunities: BrowseOpportunitiesWidget,
};

// ─── Animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function WidgetGridSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome banner skeleton */}
      <Skeleton className="h-28 w-full rounded-xl" />

      {/* Group label */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-24 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Skeleton className="h-4 w-28 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WidgetGrid() {
  const { capabilities, persona, role, loading } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>(null);

  // Show skeleton while auth is loading
  if (loading) return <WidgetGridSkeleton />;

  const visibleWidgets = WIDGETS.filter((w) => capabilities.includes(w.capability));
  const hubConfig = PERSONA_HUB_CONFIG[persona ?? "talent"];

  // Group visible widgets by their persona section
  const groupedWidgets = (["talent", "business", "funding", "oversight"] as const)
    .map((p) => ({
      persona: p,
      config: PERSONA_HUB_CONFIG[p],
      widgets: visibleWidgets.filter((w) => w.persona === p),
    }))
    .filter((g) => g.widgets.length > 0);

  // ── Full-widget view ────────────────────────────────────────────────────────
  if (activeView) {
    const ActiveComponent = WIDGET_COMPONENTS[activeView];
    const activeWidget = WIDGETS.find((w) => w.capability === activeView);

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="widget-view"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {/* Back breadcrumb */}
          <button
            onClick={() => setActiveView(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to {hubConfig.label}
          </button>

          {/* Widget title bar */}
          {activeWidget && (
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <div className={`w-9 h-9 rounded-lg ${activeWidget.color} flex items-center justify-center flex-shrink-0`}>
                <activeWidget.icon className={`w-4 h-4 ${activeWidget.accentColor}`} />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">{activeWidget.title}</h2>
                <p className="text-xs text-muted-foreground">{activeWidget.description}</p>
              </div>
            </div>
          )}

          {ActiveComponent ? (
            <ActiveComponent />
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
              <p className="text-sm font-semibold text-muted-foreground">Coming soon</p>
              <p className="text-xs text-muted-foreground/60 mt-1">This widget is under active development.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── Hub overview ────────────────────────────────────────────────────────────
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="hub-view"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-8"
      >
        {/* Welcome banner */}
        <div className={`rounded-xl bg-gradient-to-r ${hubConfig.gradient} border border-border p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 overflow-hidden relative`}>
          {/* Decorative circle */}
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-primary/5 pointer-events-none" />
          <div className="absolute -right-2 -bottom-6 w-20 h-20 rounded-full bg-primary/5 pointer-events-none" />

          <div className="flex-1 relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${hubConfig.badgeColor}`}>
                {hubConfig.label}
              </span>
              {role && (
                <span className="text-xs text-muted-foreground capitalize">{role.replace("_", " ")}</span>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground">
              Welcome to your {hubConfig.label}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{hubConfig.welcomeText}</p>
          </div>

          {/* Capability chips */}
          <div className="flex gap-2 flex-wrap relative z-10">
            {capabilities.slice(0, 3).map((cap) => (
              <span
                key={cap}
                className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border capitalize"
              >
                {cap.replace(/_/g, " ")}
              </span>
            ))}
            {capabilities.length > 3 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground/60 border border-border">
                +{capabilities.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Persona-grouped widget sections */}
        {groupedWidgets.map((group) => (
          <section key={group.persona}>
            {/* Section header — only if multiple persona groups are visible */}
            {groupedWidgets.length > 1 && (
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${group.config.badgeColor}`}>
                  {group.config.label}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {group.widgets.map((widget) => (
                <WidgetCard
                  key={widget.capability}
                  widget={widget}
                  onOpen={() => setActiveView(widget.capability)}
                />
              ))}
            </motion.div>
          </section>
        ))}

        {/* Empty state */}
        {visibleWidgets.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
            <ShieldCheck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No widgets available</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Your role hasn't been assigned yet. Please sign out and register again.</p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Widget card ──────────────────────────────────────────────────────────────

function WidgetCard({ widget, onOpen }: { widget: WidgetDef; onOpen: () => void }) {
  const Icon = widget.icon;
  const isLive = !!WIDGET_COMPONENTS[widget.capability];

  return (
    <motion.div
      variants={itemVariants}
      onClick={onOpen}
      className="group rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer relative overflow-hidden"
    >
      {/* Subtle hover gradient bg */}
      <div className={`absolute inset-0 ${widget.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none`} />

      <div className="relative z-10">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-lg ${widget.color} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200`}>
            <Icon className={`w-5 h-5 ${widget.accentColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-card-foreground">{widget.title}</h3>
              {isLive ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                  Live
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                  Soon
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{widget.description}</p>
          </div>
        </div>

        {/* Preview area */}
        <div className="mt-4 rounded-lg bg-muted/50 h-16 flex items-center justify-center border border-dashed border-border/60 overflow-hidden">
          {isLive ? (
            <p className="text-xs text-primary/60 font-medium">Click to open →</p>
          ) : (
            <p className="text-xs text-muted-foreground/50 font-medium">Coming soon</p>
          )}
        </div>

        <div className="mt-3 flex justify-end">
          <span className={`text-xs font-medium ${widget.accentColor} group-hover:underline`}>
            Open →
          </span>
        </div>
      </div>
    </motion.div>
  );
}
