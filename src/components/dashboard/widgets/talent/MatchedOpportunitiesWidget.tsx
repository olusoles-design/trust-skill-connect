import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sparkles, Search, SlidersHorizontal, ChevronDown, Send,
  MapPin, Clock, CheckCircle, Star, Loader2, AlertCircle, RefreshCw, Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import GatedFeature from "@/components/GatedFeature";
import { useAccess } from "@/hooks/useAccess";

interface MatchedOpp {
  id: string;
  title: string;
  organisation: string | null;
  type: string;
  category: string | null;
  location: string | null;
  stipend: string | null;
  closing_date: string | null;
  tags: string[] | null;
  verified: boolean;
  featured: boolean;
  match_score: number;
  match_factors: Record<string, number>;
  match_explanation: string;
}

const TYPE_COLOR: Record<string, string> = {
  learnership:   "bg-accent/20 text-accent-foreground",
  job:           "bg-primary/10 text-primary",
  gig:           "bg-muted text-muted-foreground",
  programme:     "bg-secondary/15 text-secondary-foreground",
  apprenticeship:"bg-teal/10 text-teal",
  bursary:       "bg-gold/10 text-gold",
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-green-500/15 text-green-600 border-green-500/25" :
    score >= 60 ? "bg-primary/15 text-primary border-primary/25" :
    score >= 40 ? "bg-accent/20 text-accent-foreground border-accent/30" :
                  "bg-muted text-muted-foreground border-border";
  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${color}`}>
      <Sparkles className="w-2.5 h-2.5" /> {score}%
    </span>
  );
}

function MatchCard({
  opp,
  canApply,
  onApply,
  applying,
}: {
  opp: MatchedOpp;
  canApply: boolean;
  onApply: (id: string) => void;
  applying: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        {/* Score ring */}
        <div className="flex-shrink-0 w-11 h-11 rounded-full border-2 border-primary/30 flex items-center justify-center bg-primary/5">
          <span className="text-xs font-bold text-primary">{opp.match_score}%</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-semibold text-foreground truncate">{opp.title}</p>
                {opp.verified && (
                  <CheckCircle className="w-3 h-3 text-primary flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{opp.organisation}</p>
            </div>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${TYPE_COLOR[opp.type] ?? "bg-muted text-muted-foreground"}`}>
              {opp.type}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
            {opp.location && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{opp.location}</span>}
            {opp.stipend && <span className="font-semibold text-foreground">{opp.stipend}</span>}
            {opp.closing_date && (
              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {new Date(opp.closing_date) < new Date()
                  ? "Expired"
                  : `Closes ${new Date(opp.closing_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}`}
              </span>
            )}
          </div>

          {/* Match explanation */}
          <div
            className="mt-2 cursor-pointer"
            onClick={() => setExpanded(v => !v)}
          >
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" />
              {opp.match_explanation}
              <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </p>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {Object.entries(opp.match_factors).map(([factor, score]) => (
                    <div key={factor} className="text-center">
                      <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-0.5 capitalize">{factor}</p>
                    </div>
                  ))}
                </div>
                {opp.tags && opp.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {opp.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {canApply ? (
          <button
            onClick={() => onApply(opp.id)}
            disabled={applying}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {applying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            Apply
          </button>
        ) : (
          <button className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-muted-foreground text-xs hover:bg-muted transition-all">
            <Lock className="w-3 h-3" /> Apply
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function MatchedOpportunitiesWidget() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [runningMatch, setRunningMatch] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();
  const applyAccess = useAccess("apply_for_opportunities");
  const freeLimit = 3;

  // Fetch cached matches from DB
  const { data: cachedMatches, isLoading, refetch } = useQuery({
    queryKey: ["match-results", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_results" as never)
        .select(`
          score, explanation, factors,
          opportunities(id, title, organisation, type, category, location, stipend, closing_date, tags, verified, featured)
        `)
        .eq("user_id", user!.id)
        .order("score", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => {
        const opp = r.opportunities as Record<string, unknown>;
        return {
          ...(opp as unknown as MatchedOpp),
          match_score: r.score as number,
          match_factors: (r.factors as Record<string, number>) ?? {},
          match_explanation: (r.explanation as string) ?? "Based on your profile",
        };
      }) as MatchedOpp[];
    },
  });

  // Run match engine
  const runMatchEngine = async () => {
    if (!user || runningMatch) return;
    setRunningMatch(true);
    try {
      const { error } = await supabase.functions.invoke("match-engine");
      if (error) throw error;
      await refetch();
      toast({ title: "Matches updated!" });
    } catch {
      toast({ title: "Match engine unavailable", description: "Showing cached results", variant: "destructive" });
    } finally {
      setRunningMatch(false);
    }
  };

  // Auto-run on first load if no cached matches
  useEffect(() => {
    if (user && cachedMatches !== undefined && cachedMatches.length === 0) {
      runMatchEngine();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cachedMatches?.length]);

  // Apply to opportunity
  const apply = useMutation({
    mutationFn: async (opportunityId: string) => {
      const { error } = await supabase.from("applications").insert({
        opportunity_id: opportunityId,
        applicant_id: user!.id,
      });
      if (error) {
        if (error.code === "23505") throw new Error("Already applied");
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-applications"] });
      toast({ title: "Application submitted! 🎉" });
      setApplyingId(null);
    },
    onError: (e) => {
      toast({ title: e.message === "Already applied" ? "Already applied" : "Application failed", variant: "destructive" });
      setApplyingId(null);
    },
  });

  const matches = cachedMatches ?? [];
  const TYPES = ["all", ...Array.from(new Set(matches.map(m => m.type)))];
  const filtered = matches.filter(m =>
    (typeFilter === "all" || m.type === typeFilter) &&
    (!search || m.title.toLowerCase().includes(search.toLowerCase()) ||
     (m.organisation ?? "").toLowerCase().includes(search.toLowerCase()))
  );
  const free = filtered.slice(0, freeLimit);
  const gated = filtered.slice(freeLimit);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> AI-Matched Opportunities
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {matches.length} personalized matches · scored by skills, location & profile
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(v => !v)}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={runMatchEngine}
            disabled={runningMatch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all disabled:opacity-50"
          >
            {runningMatch ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title or organisation…"
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-sm placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all"
        />
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-border bg-muted/30">
              {TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all capitalize ${
                    typeFilter === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary/40"
                  }`}
                >
                  {t === "all" ? "All Types" : t}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {(isLoading || runningMatch) && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
          {runningMatch && (
            <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Sparkles className="w-3 h-3 text-primary animate-pulse" />
              AI matching your profile to opportunities…
            </p>
          )}
        </div>
      )}

      {/* Results */}
      {!isLoading && !runningMatch && (
        <>
          {filtered.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <Sparkles className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">No matches yet — complete your profile to improve scoring.</p>
              <button onClick={runMatchEngine} className="text-xs text-primary underline">Run match engine</button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {free.map(opp => (
                  <MatchCard
                    key={opp.id}
                    opp={opp}
                    canApply={applyAccess.allowed}
                    onApply={id => { setApplyingId(id); apply.mutate(id); }}
                    applying={apply.isPending && applyingId === opp.id}
                  />
                ))}
              </div>
              {gated.length > 0 && (
                <GatedFeature
                  feature="learner:unlimited_opportunities"
                  label="Unlock All Matches"
                  onUpgrade={() => {}}
                >
                  <div className="space-y-3">
                    {gated.map(opp => (
                      <MatchCard key={opp.id} opp={opp} canApply={false} onApply={() => {}} applying={false} />
                    ))}
                  </div>
                </GatedFeature>
              )}
              {!applyAccess.allowed && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Ready to apply?</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Upgrade to Professional to submit applications.</p>
                  </div>
                  <button className="flex-shrink-0 px-4 py-2 rounded-lg gradient-teal text-primary-foreground text-xs font-semibold">
                    Upgrade →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
