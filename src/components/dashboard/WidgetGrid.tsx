import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Capability } from "@/lib/permissions";
import { WIDGET_REGISTRY, type WidgetMeta } from "./widgets/widgetRegistry";

// ─── Persona hub config ───────────────────────────────────────────────────────

const PERSONA_HUB_CONFIG: Record<string, {
  label: string;
  gradient: string;
  badgeColor: string;
  welcomeText: string;
}> = {
  talent: {
    label: "Talent Hub",
    gradient: "from-primary/20 via-primary/5 to-transparent",
    badgeColor: "bg-primary/15 text-primary border-primary/30",
    welcomeText: "Find opportunities, track your progress and earn credentials.",
  },
  business: {
    label: "Business Hub",
    gradient: "from-accent/20 via-accent/5 to-transparent",
    badgeColor: "bg-accent/25 text-accent-foreground border-accent/40",
    welcomeText: "Post opportunities, manage learners and track your B-BBEE impact.",
  },
  funding: {
    label: "Funding Hub",
    gradient: "from-secondary/20 via-secondary/5 to-transparent",
    badgeColor: "bg-secondary/15 text-secondary-foreground border-secondary/30",
    welcomeText: "Allocate funding, approve disbursements and measure skills impact.",
  },
  oversight: {
    label: "Oversight Hub",
    gradient: "from-destructive/15 via-destructive/5 to-transparent",
    badgeColor: "bg-destructive/10 text-destructive border-destructive/25",
    welcomeText: "Monitor compliance, verify credentials and generate SETA reports.",
  },
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
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-24 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-xl" />)}
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-28 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type ActiveView = Capability | null;

export function WidgetGrid() {
  const { capabilities, persona, role, loading } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>(null);

  if (loading) return <WidgetGridSkeleton />;

  // Build list of (capability, meta) pairs the user can access
  const visibleEntries = (Object.entries(WIDGET_REGISTRY) as [Capability, WidgetMeta][])
    .filter(([cap]) => capabilities.includes(cap));

  const hubConfig = PERSONA_HUB_CONFIG[persona ?? "talent"];

  // Group by widget persona section
  const personaOrder: WidgetMeta["persona"][] = ["talent", "business", "funding", "oversight"];
  const groupedSections = personaOrder
    .map(p => ({
      persona: p,
      config: PERSONA_HUB_CONFIG[p],
      entries: visibleEntries.filter(([, meta]) => meta.persona === p),
    }))
    .filter(g => g.entries.length > 0);

  // ── Full widget view ──────────────────────────────────────────────────────
  if (activeView) {
    const meta = WIDGET_REGISTRY[activeView];
    const ActiveComponent = meta?.component;

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
          <button
            onClick={() => setActiveView(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to {hubConfig.label}
          </button>

          {meta && (
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <div className={`w-9 h-9 rounded-lg ${meta.color} flex items-center justify-center flex-shrink-0`}>
                <div className={`w-5 h-5 ${meta.accentColor} flex items-center justify-center`}>
                  {/* icon rendered via meta.accentColor styling */}
                </div>
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">{meta.title}</h2>
                <p className="text-xs text-muted-foreground">{meta.description}</p>
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
            <h1 className="text-lg sm:text-xl font-bold text-foreground">Welcome to your {hubConfig.label}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{hubConfig.welcomeText}</p>
          </div>
          <div className="flex gap-2 flex-wrap relative z-10">
            {capabilities.slice(0, 3).map((cap) => (
              <span key={cap} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border capitalize">
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

        {/* Persona-grouped sections */}
        {groupedSections.map((group) => (
          <section key={group.persona}>
            {groupedSections.length > 1 && (
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
              {group.entries.map(([cap, meta]) => (
                <WidgetCard
                  key={cap}
                  capability={cap}
                  meta={meta}
                  onOpen={() => setActiveView(cap)}
                />
              ))}
            </motion.div>
          </section>
        ))}

        {visibleEntries.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
            <ShieldCheck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No widgets available yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Your role hasn't been assigned. Please sign out and register again.</p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Widget card ──────────────────────────────────────────────────────────────

function WidgetCard({ capability, meta, onOpen }: { capability: Capability; meta: WidgetMeta; onOpen: () => void }) {
  const isLive = !!meta.component;

  return (
    <motion.div
      variants={itemVariants}
      onClick={onOpen}
      className="group rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer relative overflow-hidden"
    >
      <div className={`absolute inset-0 ${meta.color} opacity-0 group-hover:opacity-60 transition-opacity duration-300 rounded-xl pointer-events-none`} />

      <div className="relative z-10">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-lg ${meta.color} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200`}>
            <div className={`w-5 h-5 ${meta.accentColor}`}>
              {/* Lucide icon via SVG — resolved via meta.icon string, rendered as placeholder */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-card-foreground">{meta.title}</h3>
              {isLive ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">Live</span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">Soon</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{meta.description}</p>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-muted/50 h-14 flex items-center justify-center border border-dashed border-border/60">
          <p className={`text-xs font-medium ${isLive ? "text-primary/60" : "text-muted-foreground/50"}`}>
            {isLive ? "Click to open →" : "Coming soon"}
          </p>
        </div>

        <div className="mt-3 flex justify-end">
          <span className={`text-xs font-medium ${meta.accentColor} group-hover:underline`}>Open →</span>
        </div>
      </div>
    </motion.div>
  );
}
