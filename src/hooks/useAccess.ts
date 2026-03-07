/**
 * useAccess — Capability-based access control hook
 *
 * Accepts either:
 *   - A named feature string (e.g. "learner:digital_cv") — looked up via FEATURE_CAPABILITY map
 *   - A direct capability (e.g. "build_profile")
 *
 * Returns { allowed, reason, upgradeRequired, limit }
 *
 * Access is denied if:
 *   1. User is not signed in
 *   2. User's role does not have the required capability
 *   3. User's plan is below the capability's minPlan (and trial has expired)
 */

import { useAuth } from "@/contexts/AuthContext";
import {
  FEATURE_CAPABILITY,
  CAPABILITY_GATES,
  PLAN_RANK,
  roleHasCapability,
  type Capability,
} from "@/lib/permissions";
import type { SubscriptionPlan } from "@/lib/permissions";

export interface AccessResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  limit?: number;
}

export function useAccess(featureOrCapability: string): AccessResult {
  const { user, role, plan, isTrialActive } = useAuth();

  // Resolve to a capability
  const capability = (
    FEATURE_CAPABILITY[featureOrCapability] ?? featureOrCapability
  ) as Capability;

  const gate = CAPABILITY_GATES[capability];

  // Unknown capability — allow by default
  if (!gate) return { allowed: true };

  // Not signed in
  if (!user) {
    return {
      allowed: false,
      reason: "Sign in to access this feature.",
      upgradeRequired: false,
    };
  }

  // Role doesn't have this capability
  if (!roleHasCapability(role, capability)) {
    return {
      allowed: false,
      reason: "This feature is not available for your account type.",
    };
  }

  // Admins bypass all subscription plan gating
  if (role === "admin") {
    return { allowed: true };
  }

  const effectivePlan: SubscriptionPlan = plan ?? "starter";
  const planRank = PLAN_RANK[effectivePlan];
  const requiredRank = PLAN_RANK[gate.minPlan];

  // Starter trial expired and feature requires a paid plan
  if (effectivePlan === "starter" && !isTrialActive && gate.minPlan !== "starter") {
    return {
      allowed: false,
      reason: "Your free trial has ended. Upgrade to unlock this feature.",
      upgradeRequired: true,
    };
  }

  // Plan too low
  if (planRank < requiredRank) {
    const planName = gate.minPlan.charAt(0).toUpperCase() + gate.minPlan.slice(1);
    return {
      allowed: false,
      reason: `Available on the ${planName} plan and above.`,
      upgradeRequired: true,
      limit: gate.limit,
    };
  }

  return { allowed: true, limit: gate.limit };
}

/**
 * useCapability — Check raw capability access without a feature string
 * Useful in dashboard components that want to conditionally render widgets.
 */
export function useCapability(capability: Capability): AccessResult {
  return useAccess(capability);
}
