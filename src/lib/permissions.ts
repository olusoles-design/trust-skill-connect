/**
 * Capability-Based Permission System
 *
 * Instead of checking role names directly, features check for capabilities.
 * Each role is assigned a set of capabilities. Adding a new role = new entry in ROLE_CAPABILITIES.
 * Adding a new feature = new entry in CAPABILITY_FEATURE_MAP.
 *
 * Subscription tiers still gate premium capabilities via CAPABILITY_MIN_PLAN.
 */

import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type SubscriptionPlan = Database["public"]["Enums"]["subscription_plan"];

// ─── Core Capabilities ─────────────────────────────────────────────────────

export type Capability =
  // Talent
  | "find_opportunities"       // Browse learnerships, jobs, gigs
  | "apply_for_opportunities"  // Submit applications / bids
  | "build_profile"            // Create CV / professional profile
  | "track_progress"           // View learning progress & milestones
  | "view_credentials"         // Digital badge & credential wallet
  | "view_tasks"               // Micro-task board for immediate income
  | "my_tasks"                 // My tasks history & earnings
  | "document_vault"           // Secure compliance document vault
  // Business
  | "post_opportunities"       // Post jobs, programmes, gigs
  | "post_tasks"               // Post micro-tasks & review submissions
  | "manage_learners"          // Intake, tracking, reporting on learners
  | "manage_procurement"       // RFQ management for support providers
  | "view_reports_bbee"        // Real-time B-BBEE scorecard dashboard
  | "marketplace_listing"      // List services in support marketplace
  | "tender_matching"          // Match to government / corporate tenders
  // Funding
  | "fund_learners"            // Sponsor / finance skills development
  | "manage_funding"           // Budget allocation & funding pool
  | "approve_payments"         // Disbursement queue & payment approvals
  // Oversight
  | "verify_documents"         // Compliance checks, credential verification
  | "view_reports"             // Access analytics, SARS/SETA, BEE reports
  | "audit_system"             // Full compliance monitoring & audit trails
  | "view_reports_seta"        // SETA-specific reporting & exports
  // Admin
  | "platform_admin";          // Full platform oversight

// ─── Persona Groups ────────────────────────────────────────────────────────

export type Persona = "talent" | "business" | "funding" | "oversight";

export const ROLE_PERSONA: Record<AppRole, Persona> = {
  learner:          "talent",
  practitioner:     "talent",
  employer:         "business",
  support_provider: "business",
  provider:         "business",
  sponsor:          "funding",
  fundi:            "funding",
  admin:            "oversight",
  seta:             "oversight",
  government:       "oversight",
};

// ─── Role → Capabilities map ────────────────────────────────────────────────

export const ROLE_CAPABILITIES: Record<AppRole, Capability[]> = {
  learner: [
    "find_opportunities",
    "apply_for_opportunities",
    "build_profile",
    "track_progress",
    "view_credentials",
    "view_tasks",
    "my_tasks",
  ],
  practitioner: [
    "find_opportunities",
    "apply_for_opportunities",
    "build_profile",
    "track_progress",
    "view_credentials",
    "view_tasks",
    "my_tasks",
    "marketplace_listing",
  ],
  employer: [
    "post_opportunities",
    "post_tasks",
    "manage_learners",
    "view_reports",
    "view_reports_bbee",
  ],
  provider: [
    "post_opportunities",
    "post_tasks",
    "manage_learners",
    "view_reports",
    "view_reports_bbee",
    "verify_documents",
  ],
  sponsor: [
    "fund_learners",
    "manage_learners",
    "view_reports",
    "view_reports_bbee",
    "verify_documents",
    "manage_funding",
    "approve_payments",
  ],
  fundi: [
    "fund_learners",
    "find_opportunities",
    "view_reports",
    "manage_funding",
    "approve_payments",
  ],
  support_provider: [
    "marketplace_listing",
    "tender_matching",
    "manage_procurement",
    "view_reports",
  ],
  seta: [
    "verify_documents",
    "view_reports",
    "view_reports_seta",
    "manage_learners",
    "audit_system",
    "platform_admin",
  ],
  government: [
    "view_reports",
    "view_reports_seta",
    "verify_documents",
    "tender_matching",
    "audit_system",
    "platform_admin",
  ],
  admin: [
    "find_opportunities",
    "apply_for_opportunities",
    "build_profile",
    "track_progress",
    "view_credentials",
    "view_tasks",
    "my_tasks",
    "post_opportunities",
    "post_tasks",
    "manage_learners",
    "manage_procurement",
    "view_reports_bbee",
    "fund_learners",
    "manage_funding",
    "approve_payments",
    "verify_documents",
    "view_reports",
    "view_reports_seta",
    "audit_system",
    "marketplace_listing",
    "tender_matching",
    "platform_admin",
  ],
};

// ─── Subscription gating ─────────────────────────────────────────────────────

export interface CapabilityGate {
  minPlan: SubscriptionPlan;
  limit?: number;
}

export const CAPABILITY_GATES: Record<Capability, CapabilityGate> = {
  // Talent
  find_opportunities:      { minPlan: "starter", limit: 3 },
  apply_for_opportunities: { minPlan: "professional" },
  build_profile:           { minPlan: "professional" },
  track_progress:          { minPlan: "starter" },
  view_credentials:        { minPlan: "starter" },
  view_tasks:              { minPlan: "starter", limit: 5 },
  my_tasks:                { minPlan: "starter" },
  // Business
  post_opportunities:      { minPlan: "starter", limit: 1 },
  post_tasks:              { minPlan: "starter", limit: 3 },
  manage_learners:         { minPlan: "professional" },
  manage_procurement:      { minPlan: "professional" },
  view_reports_bbee:       { minPlan: "professional" },
  marketplace_listing:     { minPlan: "starter", limit: 1 },
  tender_matching:         { minPlan: "professional" },
  // Funding
  fund_learners:           { minPlan: "starter" },
  manage_funding:          { minPlan: "professional" },
  approve_payments:        { minPlan: "professional" },
  // Oversight
  verify_documents:        { minPlan: "professional" },
  view_reports:            { minPlan: "professional" },
  view_reports_seta:       { minPlan: "professional" },
  audit_system:            { minPlan: "professional" },
  // Admin
  platform_admin:          { minPlan: "starter" },
};

// ─── Plan ranking ──────────────────────────────────────────────────────────

export const PLAN_RANK: Record<SubscriptionPlan, number> = {
  starter:      0,
  professional: 1,
  enterprise:   2,
};

// ─── Helpers ──────────────────────────────────────────────────────────────

export function roleHasCapability(role: AppRole | null, capability: Capability): boolean {
  if (!role) return false;
  return ROLE_CAPABILITIES[role]?.includes(capability) ?? false;
}

// ─── Feature → capability map (backwards-compat bridge) ───────────────────

export const FEATURE_CAPABILITY: Record<string, Capability> = {
  // Learner
  "learner:browse_opportunities":       "find_opportunities",
  "learner:unlimited_opportunities":    "find_opportunities",
  "learner:digital_cv":                 "build_profile",
  "learner:priority_application":       "apply_for_opportunities",
  "learner:micro_tasks":                "view_tasks",
  "learner:my_tasks":                   "my_tasks",
  "learner:credentials":                "view_credentials",
  "learner:progress":                   "track_progress",
  // Employer
  "employer:post_jobs":                 "post_opportunities",
  "employer:post_tasks":                "post_tasks",
  "employer:manage_candidates":         "manage_learners",
  "employer:reports":                   "view_reports",
  "employer:bbee":                      "view_reports_bbee",
  // Sponsor
  "sponsor:candidate_pipeline":         "manage_learners",
  "sponsor:bee_dashboard":              "view_reports_bbee",
  "sponsor:tax_calculator":             "view_reports_bbee",
  "sponsor:compliance_reports":         "view_reports",
  "sponsor:fund_learner":               "fund_learners",
  "sponsor:manage_funding":             "manage_funding",
  // Provider (SDP)
  "provider:post_programmes":           "post_opportunities",
  "provider:unlimited_programmes":      "post_opportunities",
  "provider:learner_intake":            "manage_learners",
  "provider:outcome_tracking":          "manage_learners",
  // Practitioner
  "practitioner:browse_gigs":           "find_opportunities",
  "practitioner:bid_contracts":         "apply_for_opportunities",
  "practitioner:verified_badge":        "build_profile",
  // Support Provider
  "support_provider:listing":           "marketplace_listing",
  "support_provider:unlimited_listing": "marketplace_listing",
  "support_provider:tender_matching":   "tender_matching",
  "support_provider:procurement":       "manage_procurement",
  // Fundi
  "fundi:fund_learner":                 "fund_learners",
  "fundi:reports":                      "view_reports",
  "fundi:manage_funding":               "manage_funding",
  // Oversight
  "seta:verify":                        "verify_documents",
  "seta:reports":                       "view_reports_seta",
  "seta:audit":                         "audit_system",
  "government:reports":                 "view_reports_seta",
  "government:tender_matching":         "tender_matching",
  "government:audit":                   "audit_system",
  "admin:platform":                     "platform_admin",
};
