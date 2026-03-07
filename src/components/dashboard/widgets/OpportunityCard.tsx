import { motion } from "framer-motion";
import { MapPin, Clock, BadgeCheck, Sparkles, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Opportunity, OpportunityType } from "@/data/mockOpportunities";

const TYPE_STYLES: Record<OpportunityType, { label: string; className: string }> = {
  learnership:    { label: "Learnership",    className: "bg-primary/10 text-primary border-primary/20" },
  job:            { label: "Job",            className: "bg-secondary/10 text-secondary-foreground border-secondary/20" },
  gig:            { label: "Gig",            className: "bg-accent/20 text-accent-foreground border-accent/30" },
  programme:      { label: "Programme",      className: "bg-primary/10 text-primary border-primary/20" },
  apprenticeship: { label: "Apprenticeship", className: "bg-teal/10 text-teal border-teal/20" },
  bursary:        { label: "Bursary",        className: "bg-gold/10 text-gold border-gold/20" },
};

interface Props {
  opportunity: Opportunity;
  index: number;
  onApply?: (id: string) => void;
  canApply: boolean;
}

export function OpportunityCard({ opportunity: opp, index, onApply, canApply }: Props) {
  const typeStyle = TYPE_STYLES[opp.type];

  // Days until closing
  const daysLeft = Math.ceil(
    (new Date(opp.closingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const isUrgent = daysLeft <= 14;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.06 }}
      className="group rounded-xl border border-border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      {/* Top accent bar */}
      <div className="h-0.5 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeStyle.className}`}>
                {typeStyle.label}
              </span>
              {opp.verified && (
                <span className="flex items-center gap-0.5 text-[10px] text-primary font-medium">
                  <BadgeCheck className="w-3 h-3" /> Verified
                </span>
              )}
              {opp.bbbeePoints && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20 font-medium">
                  B-BBEE
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-card-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {opp.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{opp.organisation}</p>
          </div>

          {opp.stipend && (
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-semibold text-primary">{opp.stipend}</p>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
          {opp.description}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 flex-shrink-0" /> {opp.location}
          </span>
          {opp.duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 flex-shrink-0" /> {opp.duration}
            </span>
          )}
          {opp.seta && (
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 flex-shrink-0" /> {opp.seta}
            </span>
          )}
        </div>

        {/* Tags */}
        {opp.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {opp.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between pt-3 border-t border-border/60">
          <span className={`flex items-center gap-1 text-xs font-medium ${isUrgent ? "text-destructive" : "text-muted-foreground"}`}>
            <Calendar className="w-3 h-3" />
            {isUrgent ? `${daysLeft}d left` : `Closes ${new Date(opp.closingDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}`}
          </span>

          {canApply ? (
            <button
              onClick={() => onApply?.(opp.id)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg gradient-teal text-primary-foreground hover:opacity-90 hover:scale-[1.02] transition-all"
            >
              Apply Now →
            </button>
          ) : (
            <span className="text-xs text-muted-foreground/60 font-medium">
              Upgrade to apply →
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
