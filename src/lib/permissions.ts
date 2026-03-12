/**
 * Capability-Based Permission System
 */

import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type SubscriptionPlan = Database["public"]["Enums"]["subscription_plan"];

// ─── Core Capabilities ─────────────────────────────────────────────────────

export type Capability =
  // Talent / Learner
  | "find_opportunities"
  | "apply_for_opportunities"
  | "build_profile"
  | "track_progress"
  | "view_credentials"
  | "view_tasks"
  | "my_tasks"
  | "document_vault"
  // Practitioner
  | "availability_toggle"      // Availability switch + reputation
  | "smart_contracting"        // SLA templates + digital timesheets
  | "practitioner_accreditations" // Statutory accreditation docs per role
  // Business – Employer/Sponsor
  | "post_opportunities"
  | "post_tasks"
  | "manage_learners"
  | "learner_pipeline"         // Live learnership pipeline tracker
  | "bbee_simulator"           // Interactive B-BBEE scorecard simulator
  | "tax_calculator"           // Section 12H tax allowance calculator
  | "wsp_reports"              // WSP/ATR one-click report generation
  | "view_reports_bbee"
  // Business – SDP (provider)
  | "tender_feed"              // Live employer demand / bid feed
  | "learner_recruitment"      // Unplaced candidate pool with filters
  | "outcome_tracking"         // Pass/employment rate analytics
  | "manage_procurement"
  | "marketplace_listing"
  | "tender_matching"
  // Business – Support Provider
  | "procurement_alerts"       // AI demand signal alerts
  | "rfq_board"                // Real-time RFQ board
  | "facility_booking"         // Venue availability calendar
  // Funding
  | "fund_learners"
  | "manage_funding"
  | "approve_payments"
  | "post_funding_opportunities"  // Sponsor posts funding briefs
  | "browse_funding_opportunities" // SDPs discover and submit EOIs
  // Oversight
  | "verify_documents"
  | "view_reports"
  | "audit_system"
  | "view_reports_seta"
  // Phase 3 – Glue features
  | "marketplace_discovery"  // Advanced search: find SDPs, facilitators, venues
  | "workflow_engine"        // RFP→RFQ deal flow, learner registration, SETA packet
  | "trust_ledger"           // Immutable audit ledger + QR verification
  | "multi_company_sponsorship" // Lead/Host/Funder company management + B-BBEE allocation
  // Admin
  | "platform_admin"
  | "portal_switcher"
  | "upload_accreditation"       // AI-powered accreditation letter extraction
  | "post_programme_opportunities" // Sponsor lists learnership/bursary/internship in main feed
  | "manage_sponsor_profile"       // Sponsor manages their own directory listing
  | "browse_sponsor_directory"    // Learners/providers browse the sponsor directory
  | "browse_practitioner_directory" // Any authenticated user finds registered practitioners
  | "view_audit_logs";              // Platform Admin / Oversight — full audit trail

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
    "document_vault",
    "browse_sponsor_directory",
    "browse_practitioner_directory",
  ],
  practitioner: [
    "find_opportunities",
    "apply_for_opportunities",
    "build_profile",
    "track_progress",
    "view_credentials",
    "marketplace_listing",
    "document_vault",
    "availability_toggle",
    "smart_contracting",
    "marketplace_discovery",
    "practitioner_accreditations",
    "upload_accreditation",
    "browse_sponsor_directory",
    "browse_practitioner_directory",
  ],
  employer: [
    "post_opportunities",
    "post_tasks",
    "manage_learners",
    "learner_pipeline",
    "view_reports",
    "view_reports_bbee",
    "bbee_simulator",
    "tax_calculator",
    "wsp_reports",
    "tender_feed",
    "workflow_engine",
    "multi_company_sponsorship",
    "marketplace_discovery",
    "browse_sponsor_directory",
    "browse_practitioner_directory",
  ],
  provider: [
    "post_opportunities",
    "post_tasks",
    "manage_learners",
    "view_reports",
    "view_reports_bbee",
    "verify_documents",
    "tender_feed",
    "learner_recruitment",
    "outcome_tracking",
    "manage_procurement",
    "document_vault",
    "marketplace_discovery",
    "workflow_engine",
    "browse_funding_opportunities",
    "browse_sponsor_directory",
    "browse_practitioner_directory",
  ],
  sponsor: [
    "fund_learners",
    "manage_learners",
    "learner_pipeline",
    "view_reports",
    "view_reports_bbee",
    "bbee_simulator",
    "tax_calculator",
    "wsp_reports",
    "verify_documents",
    "manage_funding",
    "approve_payments",
    "workflow_engine",
    "multi_company_sponsorship",
    "marketplace_discovery",
    "post_funding_opportunities",
    "post_programme_opportunities",
    "manage_sponsor_profile",
    "browse_practitioner_directory",
  ],
  fundi: [
    "fund_learners",
    "find_opportunities",
    "view_reports",
    "manage_funding",
    "approve_payments",
    "marketplace_discovery",
    "browse_sponsor_directory",
    "browse_practitioner_directory",
  ],
  support_provider: [
    "marketplace_listing",
    "marketplace_discovery",
    "tender_matching",
    "manage_procurement",
    "view_reports",
    "procurement_alerts",
    "rfq_board",
    "facility_booking",
    "document_vault",
    "browse_sponsor_directory",
    "browse_practitioner_directory",
  ],
  seta: [
    "verify_documents",
    "view_reports",
    "view_reports_seta",
    "manage_learners",
    "audit_system",
    "trust_ledger",
    "platform_admin",
    "browse_sponsor_directory",
    "browse_practitioner_directory",
    "view_audit_logs",
  ],
  government: [
    "view_reports",
    "view_reports_seta",
    "verify_documents",
    "tender_matching",
    "audit_system",
    "trust_ledger",
    "platform_admin",
    "document_vault",
    "browse_sponsor_directory",
    "browse_practitioner_directory",
    "view_audit_logs",
  ],
  admin: [
    "portal_switcher",
    "find_opportunities",
    "apply_for_opportunities",
    "build_profile",
    "track_progress",
    "view_credentials",
    "view_tasks",
    "my_tasks",
    "document_vault",
    "availability_toggle",
    "smart_contracting",
    "post_opportunities",
    "post_tasks",
    "manage_learners",
    "learner_pipeline",
    "bbee_simulator",
    "tax_calculator",
    "wsp_reports",
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
    "marketplace_discovery",
    "tender_matching",
    "tender_feed",
    "learner_recruitment",
    "outcome_tracking",
    "procurement_alerts",
    "rfq_board",
    "facility_booking",
    "workflow_engine",
    "trust_ledger",
    "platform_admin",
    "post_funding_opportunities",
    "browse_funding_opportunities",
    "post_programme_opportunities",
    "manage_sponsor_profile",
    "browse_sponsor_directory",
    "browse_practitioner_directory",
    "view_audit_logs",
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
  document_vault:          { minPlan: "starter" },
  // Practitioner
  availability_toggle:          { minPlan: "starter" },
  smart_contracting:            { minPlan: "professional" },
  practitioner_accreditations:  { minPlan: "starter" },
  // Business – Employer/Sponsor
  post_opportunities:      { minPlan: "starter", limit: 1 },
  post_tasks:              { minPlan: "starter", limit: 3 },
  manage_learners:         { minPlan: "professional" },
  learner_pipeline:        { minPlan: "professional" },
  bbee_simulator:          { minPlan: "starter" },
  tax_calculator:          { minPlan: "professional" },
  wsp_reports:             { minPlan: "professional" },
  view_reports_bbee:       { minPlan: "professional" },
  // SDP
  tender_feed:             { minPlan: "starter" },
  learner_recruitment:     { minPlan: "professional" },
  outcome_tracking:        { minPlan: "professional" },
  manage_procurement:      { minPlan: "professional" },
  marketplace_listing:     { minPlan: "starter", limit: 1 },
  tender_matching:         { minPlan: "professional" },
  // Support Provider
  procurement_alerts:      { minPlan: "starter" },
  rfq_board:               { minPlan: "starter" },
  facility_booking:        { minPlan: "professional" },
  // Funding
  fund_learners:               { minPlan: "starter" },
  manage_funding:              { minPlan: "professional" },
  approve_payments:            { minPlan: "professional" },
  post_funding_opportunities:  { minPlan: "starter", limit: 3 },
  browse_funding_opportunities:{ minPlan: "starter" },
  // Oversight
  verify_documents:        { minPlan: "professional" },
  view_reports:            { minPlan: "professional" },
  view_reports_seta:       { minPlan: "professional" },
  audit_system:            { minPlan: "professional" },
  trust_ledger:            { minPlan: "professional" },
  // Phase 3 – Glue
  marketplace_discovery:   { minPlan: "starter" },
  workflow_engine:         { minPlan: "professional" },
  multi_company_sponsorship: { minPlan: "professional" },
  // Admin
  platform_admin:          { minPlan: "starter" },
  portal_switcher:         { minPlan: "starter" },
  upload_accreditation:            { minPlan: "starter" },
  post_programme_opportunities:    { minPlan: "starter", limit: 3 },
  // Sponsor Directory
  manage_sponsor_profile:               { minPlan: "starter" },
  browse_sponsor_directory:             { minPlan: "starter" },
  // Practitioner Directory
  browse_practitioner_directory:        { minPlan: "starter" },
  // Audit Log
  view_audit_logs:                      { minPlan: "starter" },
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
  "learner:browse_opportunities":       "find_opportunities",
  "learner:unlimited_opportunities":    "find_opportunities",
  "learner:digital_cv":                 "build_profile",
  "learner:priority_application":       "apply_for_opportunities",
  "learner:micro_tasks":                "view_tasks",
  "learner:my_tasks":                   "my_tasks",
  "learner:credentials":                "view_credentials",
  "learner:progress":                   "track_progress",
  "employer:post_jobs":                 "post_opportunities",
  "employer:post_tasks":                "post_tasks",
  "employer:manage_candidates":         "manage_learners",
  "employer:reports":                   "view_reports",
  "employer:bbee":                      "view_reports_bbee",
  "employer:bbee_simulator":            "bbee_simulator",
  "employer:tax_calculator":            "tax_calculator",
  "employer:wsp_reports":               "wsp_reports",
  "sponsor:candidate_pipeline":         "manage_learners",
  "sponsor:bee_dashboard":              "view_reports_bbee",
  "sponsor:tax_calculator":             "tax_calculator",
  "sponsor:compliance_reports":         "view_reports",
  "sponsor:fund_learner":               "fund_learners",
  "sponsor:manage_funding":             "manage_funding",
  "provider:post_programmes":           "post_opportunities",
  "provider:unlimited_programmes":      "post_opportunities",
  "provider:learner_intake":            "manage_learners",
  "provider:outcome_tracking":          "outcome_tracking",
  "provider:tender_feed":               "tender_feed",
  "provider:learner_recruitment":       "learner_recruitment",
  "practitioner:browse_gigs":           "find_opportunities",
  "practitioner:bid_contracts":         "apply_for_opportunities",
  "practitioner:verified_badge":        "build_profile",
  "practitioner:availability":          "availability_toggle",
  "practitioner:smart_contracting":     "smart_contracting",
  "support_provider:listing":           "marketplace_listing",
  "support_provider:unlimited_listing": "marketplace_listing",
  "support_provider:tender_matching":   "tender_matching",
  "support_provider:procurement":       "manage_procurement",
  "support_provider:alerts":            "procurement_alerts",
  "support_provider:rfq":               "rfq_board",
  "support_provider:booking":           "facility_booking",
  "fundi:fund_learner":                 "fund_learners",
  "fundi:reports":                      "view_reports",
  "fundi:manage_funding":               "manage_funding",
  "seta:verify":                        "verify_documents",
  "seta:reports":                       "view_reports_seta",
  "seta:audit":                         "audit_system",
  "government:reports":                 "view_reports_seta",
  "government:tender_matching":         "tender_matching",
  "government:audit":                   "audit_system",
  "admin:platform":                     "platform_admin",
  "practitioner:upload_accreditation":  "upload_accreditation",
};
