import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type SubscriptionPlan = Database["public"]["Enums"]["subscription_plan"];

// Feature definitions: which plans unlock each feature per role
const FEATURE_ACCESS: Record<string, { roles: AppRole[]; minPlan: SubscriptionPlan; limit?: number }> = {
  // Learner
  "learner:browse_opportunities":       { roles: ["learner"], minPlan: "starter", limit: 3 },
  "learner:unlimited_opportunities":    { roles: ["learner"], minPlan: "professional" },
  "learner:digital_cv":                 { roles: ["learner"], minPlan: "professional" },
  "learner:priority_application":       { roles: ["learner"], minPlan: "professional" },
  "learner:micro_tasks":                { roles: ["learner"], minPlan: "starter" },

  // Sponsor
  "sponsor:candidate_pipeline":         { roles: ["sponsor"], minPlan: "starter" },
  "sponsor:bee_dashboard":              { roles: ["sponsor"], minPlan: "professional" },
  "sponsor:tax_calculator":             { roles: ["sponsor"], minPlan: "professional" },
  "sponsor:compliance_reports":         { roles: ["sponsor"], minPlan: "professional" },

  // Provider (SDP)
  "provider:post_programmes":           { roles: ["provider"], minPlan: "starter", limit: 1 },
  "provider:unlimited_programmes":      { roles: ["provider"], minPlan: "professional" },
  "provider:learner_intake":            { roles: ["provider"], minPlan: "professional" },
  "provider:outcome_tracking":          { roles: ["provider"], minPlan: "professional" },

  // Practitioner
  "practitioner:browse_gigs":           { roles: ["practitioner"], minPlan: "starter" },
  "practitioner:bid_contracts":         { roles: ["practitioner"], minPlan: "professional" },
  "practitioner:verified_badge":        { roles: ["practitioner"], minPlan: "professional" },

  // Support Provider
  "support_provider:listing":           { roles: ["support_provider"], minPlan: "starter", limit: 1 },
  "support_provider:unlimited_listing": { roles: ["support_provider"], minPlan: "professional" },
  "support_provider:tender_matching":   { roles: ["support_provider"], minPlan: "professional" },
};

const PLAN_RANK: Record<SubscriptionPlan, number> = {
  starter: 0,
  professional: 1,
  enterprise: 2,
};

export interface AccessResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  limit?: number;
}

export function useAccess(feature: string): AccessResult {
  const { user, role, plan, isTrialActive } = useAuth();

  const def = FEATURE_ACCESS[feature];
  if (!def) return { allowed: true };

  // Not logged in
  if (!user) return { allowed: false, reason: "Sign in to access this feature.", upgradeRequired: false };

  // Wrong role
  if (role && !def.roles.includes(role)) {
    return { allowed: false, reason: "This feature is not available for your account type." };
  }

  const effectivePlan: SubscriptionPlan = plan ?? "starter";
  const planRank = PLAN_RANK[effectivePlan];
  const requiredRank = PLAN_RANK[def.minPlan];

  // Starter plan: check trial
  if (effectivePlan === "starter" && !isTrialActive && def.minPlan !== "starter") {
    return {
      allowed: false,
      reason: "Your free trial has ended. Upgrade to unlock this feature.",
      upgradeRequired: true,
    };
  }

  if (planRank < requiredRank) {
    return {
      allowed: false,
      reason: `Available on ${def.minPlan.charAt(0).toUpperCase() + def.minPlan.slice(1)} plan and above.`,
      upgradeRequired: true,
      limit: def.limit,
    };
  }

  return { allowed: true, limit: def.limit };
}
