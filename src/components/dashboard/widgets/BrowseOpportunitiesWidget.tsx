import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, Lock, ChevronDown } from "lucide-react";
import { useAccess } from "@/hooks/useAccess";
import GatedFeature from "@/components/GatedFeature";
import { OpportunityCard } from "./OpportunityCard";
import { MOCK_OPPORTUNITIES } from "@/data/mockOpportunities";
import type { OpportunityType, OpportunityCategory } from "@/data/mockOpportunities";
import { Badge } from "@/components/ui/badge";

const ALL_TYPES: OpportunityType[] = ["learnership", "job", "gig", "programme", "apprenticeship", "bursary"];
const ALL_CATEGORIES: OpportunityCategory[] = ["ICT", "Construction", "Finance", "Health", "Education", "Engineering", "Agriculture", "Hospitality"];

const TYPE_LABELS: Record<OpportunityType, string> = {
  learnership: "Learnerships",
  job: "Jobs",
  gig: "Gigs",
  programme: "Programmes",
  apprenticeship: "Apprenticeships",
  bursary: "Bursaries",
};

export function BrowseOpportunitiesWidget() {
  const browseAccess = useAccess("find_opportunities");
  const applyAccess  = useAccess("apply_for_opportunities");

  // Subscription limit: starter = 3 free results, then gate the rest
  const freeLimit = browseAccess.limit ?? 3;

  const [search, setSearch]           = useState("");
  const [activeType, setActiveType]   = useState<OpportunityType | "all">("all");
  const [activeCategory, setActiveCategory] = useState<OpportunityCategory | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return MOCK_OPPORTUNITIES.filter((opp) => {
      const matchType     = activeType === "all"     || opp.type === activeType;
      const matchCategory = activeCategory === "all" || opp.category === activeCategory;
      const matchSearch   = !search || [opp.title, opp.organisation, opp.location, ...opp.tags]
        .some((s) => s.toLowerCase().includes(search.toLowerCase()));
      return matchType && matchCategory && matchSearch;
    });
  }, [search, activeType, activeCategory]);

  // First `freeLimit` are always shown; the rest are gated
  const freeResults  = filtered.slice(0, freeLimit);
  const gatedResults = filtered.slice(freeLimit);
  const hasGated     = gatedResults.length > 0;

  if (!browseAccess.allowed) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-semibold text-card-foreground mb-1">Access Restricted</p>
        <p className="text-xs text-muted-foreground">{browseAccess.reason}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Widget header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Browse Opportunities</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filtered.length} opportunities matched
            {freeLimit && !applyAccess.allowed
              ? ` · ${freeLimit} free previews`
              : ""}
          </p>
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted/50 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, organisation, location or tag…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
        />
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
              {/* Type filter */}
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Type</p>
                <div className="flex flex-wrap gap-1.5">
                  <FilterChip
                    label="All Types"
                    active={activeType === "all"}
                    onClick={() => setActiveType("all")}
                  />
                  {ALL_TYPES.map((t) => (
                    <FilterChip
                      key={t}
                      label={TYPE_LABELS[t]}
                      active={activeType === t}
                      onClick={() => setActiveType(t)}
                    />
                  ))}
                </div>
              </div>

              {/* Category filter */}
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sector</p>
                <div className="flex flex-wrap gap-1.5">
                  <FilterChip
                    label="All Sectors"
                    active={activeCategory === "all"}
                    onClick={() => setActiveCategory("all")}
                  />
                  {ALL_CATEGORIES.map((c) => (
                    <FilterChip
                      key={c}
                      label={c}
                      active={activeCategory === c}
                      onClick={() => setActiveCategory(c as OpportunityCategory)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Free results */}
      {freeResults.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
          <p className="text-sm text-muted-foreground">No opportunities match your filters.</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {freeResults.map((opp, i) => (
          <OpportunityCard
            key={opp.id}
            opportunity={opp}
            index={i}
            canApply={applyAccess.allowed}
            onApply={(id) => console.log("apply →", id)}
          />
        ))}
      </div>

      {/* Gated results — blurred behind GatedFeature */}
      {hasGated && (
        <GatedFeature
          feature="learner:unlimited_opportunities"
          label="Unlock All Opportunities"
          onUpgrade={() => console.log("upgrade →")}
        >
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {gatedResults.map((opp, i) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                index={i}
                canApply={false}
                onApply={() => {}}
              />
            ))}
          </div>
        </GatedFeature>
      )}

      {/* Apply gating banner — shown if browsing is allowed but applying is not */}
      {browseAccess.allowed && !applyAccess.allowed && freeResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between gap-4"
        >
          <div>
            <p className="text-sm font-semibold text-foreground">Ready to apply?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {applyAccess.reason ?? "Upgrade to the Professional plan to submit applications."}
            </p>
          </div>
          <button className="flex-shrink-0 px-4 py-2 rounded-lg gradient-teal text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all hover:scale-[1.02]">
            Upgrade Plan →
          </button>
        </motion.div>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
