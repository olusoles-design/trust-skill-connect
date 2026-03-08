/**
 * Widget Registry — maps each Capability to its component + metadata.
 */

import type { ComponentType } from "react";
import type { Capability } from "@/lib/permissions";

// ─── Talent
import { BrowseOpportunitiesWidget }   from "./BrowseOpportunitiesWidget";
import { MyApplicationsWidget }        from "./talent/MyApplicationsWidget";
import { LearningProgressWidget }      from "./talent/LearningProgressWidget";
import { CredentialWalletWidget }      from "./talent/CredentialWalletWidget";
import { MicroTaskBoardWidget }        from "./talent/MicroTaskBoardWidget";
import { MyTasksWidget }               from "./talent/MyTasksWidget";
import { ProfileCVWidget }             from "./talent/ProfileCVWidget";
import { DocumentVaultWidget }         from "./talent/DocumentVaultWidget";
import { AvailabilityToggleWidget }    from "./talent/AvailabilityToggleWidget";
import { SmartContractingWidget }      from "./talent/SmartContractingWidget";
import { PractitionerAccreditationsWidget } from "./talent/PractitionerAccreditationsWidget";
import { AccreditationUploaderWidget }      from "./talent/AccreditationUploaderWidget";

// ─── Business
import { OpportunityManagerWidget }    from "./business/OpportunityManagerWidget";
import { TeamRosterWidget }            from "./business/TeamRosterWidget";
import { BEEEDashboardWidget }         from "./business/BEEEDashboardWidget";
import { BEESimulatorWidget }          from "./business/BEESimulatorWidget";
import { LearnerPipelineWidget }       from "./business/LearnerPipelineWidget";
import { TaxCalculatorWidget }         from "./business/TaxCalculatorWidget";
import { WSPReportWidget }             from "./business/WSPReportWidget";
import { ProcurementDashboardWidget }  from "./business/ProcurementDashboardWidget";
import { MarketplaceListingWidget }    from "./business/MarketplaceListingWidget";
import { MarketplaceDiscoveryWidget }  from "./business/MarketplaceDiscoveryWidget";
import { TenderMatchingWidget }        from "./business/TenderMatchingWidget";
import { TenderFeedWidget }            from "./business/TenderFeedWidget";
import { LearnerRecruitmentWidget }    from "./business/LearnerRecruitmentWidget";
import { OutcomeTrackingWidget }       from "./business/OutcomeTrackingWidget";
import { ProcurementAlertsWidget }     from "./business/ProcurementAlertsWidget";
import { RFQBoardWidget }              from "./business/RFQBoardWidget";
import { FacilityBookingWidget }       from "./business/FacilityBookingWidget";
import { TaskPosterWidget }            from "./business/TaskPosterWidget";
import { WorkflowEngineWidget }        from "./business/WorkflowEngineWidget";
import { MultiCompanySponsorshipWidget } from "./business/MultiCompanySponsorshipWidget";

// ─── Funding
import { FundingAllocationWidget }     from "./funding/FundingAllocationWidget";
import { DisbursementQueueWidget }     from "./funding/DisbursementQueueWidget";
import { SponsorOpportunityWidget }    from "./funding/SponsorOpportunityWidget";
import { FundingOpportunitiesWidget }  from "./business/FundingOpportunitiesWidget";

// ─── Oversight
import { VerificationQueueWidget }     from "./oversight/VerificationQueueWidget";
import { ReportsAnalyticsWidget }      from "./oversight/ReportsAnalyticsWidget";
import { SETAReportingWidget }         from "./oversight/SETAReportingWidget";
import { ComplianceMonitorWidget }     from "./oversight/ComplianceMonitorWidget";
import { PlatformAdminWidget }         from "./oversight/PlatformAdminWidget";
import { TrustLedgerWidget }           from "./oversight/TrustLedgerWidget";
import { PortalSwitcherWidget }        from "./oversight/PortalSwitcherWidget";

// ─── Types ────────────────────────────────────────────────────────────────────

export type WidgetLayout  = "full" | "half" | "third";
export type WidgetPersona = "talent" | "business" | "funding" | "oversight";

export interface WidgetMeta {
  component:   ComponentType<any>;
  layout:      WidgetLayout;
  persona:     WidgetPersona;
  title:       string;
  description: string;
  icon:        string;
  color:       string;
  accentColor: string;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const WIDGET_REGISTRY: Partial<Record<Capability, WidgetMeta>> = {

  // ── Talent ─────────────────────────────────────────────────────────────────
  find_opportunities: {
    component: BrowseOpportunitiesWidget, layout: "full", persona: "talent",
    title: "Browse Opportunities", description: "Discover learnerships, jobs, gigs and programmes.",
    icon: "Search", color: "bg-primary/10", accentColor: "text-primary",
  },
  apply_for_opportunities: {
    component: MyApplicationsWidget, layout: "full", persona: "talent",
    title: "My Applications", description: "Track all your submitted applications and bids.",
    icon: "Send", color: "bg-primary/10", accentColor: "text-primary",
  },
  build_profile: {
    component: ProfileCVWidget, layout: "half", persona: "talent",
    title: "Profile & Digital CV", description: "Build a verified professional profile.",
    icon: "FileText", color: "bg-primary/10", accentColor: "text-primary",
  },
  track_progress: {
    component: LearningProgressWidget, layout: "half", persona: "talent",
    title: "Learning Progress", description: "Track your current programme milestones.",
    icon: "TrendingUp", color: "bg-primary/10", accentColor: "text-primary",
  },
  view_credentials: {
    component: CredentialWalletWidget, layout: "half", persona: "talent",
    title: "Credential Wallet", description: "Your verified digital badges and qualifications.",
    icon: "Award", color: "bg-primary/10", accentColor: "text-primary",
  },
  view_tasks: {
    component: MicroTaskBoardWidget, layout: "full", persona: "talent",
    title: "Micro-Task Board", description: "Find short-term tasks and gigs for immediate income.",
    icon: "ListTodo", color: "bg-primary/10", accentColor: "text-primary",
  },
  my_tasks: {
    component: MyTasksWidget, layout: "half", persona: "talent",
    title: "My Tasks & Earnings", description: "Track completed tasks, earnings and quality ratings.",
    icon: "Wallet", color: "bg-primary/10", accentColor: "text-primary",
  },
  document_vault: {
    component: DocumentVaultWidget, layout: "half", persona: "talent",
    title: "Document Vault", description: "Secure compliance document storage with expiry tracking.",
    icon: "ShieldCheck", color: "bg-primary/10", accentColor: "text-primary",
  },
  availability_toggle: {
    component: AvailabilityToggleWidget, layout: "half", persona: "talent",
    title: "Availability & Contracts", description: "Toggle availability, manage contracts and reputation score.",
    icon: "ToggleRight", color: "bg-primary/10", accentColor: "text-primary",
  },
  smart_contracting: {
    component: SmartContractingWidget, layout: "half", persona: "talent",
    title: "Smart Contracting", description: "Digital timesheets, geo clock-in/out, SLA templates and invoicing.",
    icon: "FileSignature", color: "bg-primary/10", accentColor: "text-primary",
  },
  practitioner_accreditations: {
    component: PractitionerAccreditationsWidget, layout: "full", persona: "talent",
    title: "Practitioner Accreditations", description: "Upload and manage statutory documents for each practitioner role — Assessor, Facilitator, Moderator, SDF.",
    icon: "BadgeCheck", color: "bg-primary/10", accentColor: "text-primary",
  },

  // ── Business – Employer/Sponsor ─────────────────────────────────────────────
  post_tasks: {
    component: TaskPosterWidget, layout: "half", persona: "business",
    title: "Task Poster", description: "Post micro-tasks and manage submissions.",
    icon: "PlusSquare", color: "bg-primary/10", accentColor: "text-primary",
  },
  post_opportunities: {
    component: OpportunityManagerWidget, layout: "full", persona: "business",
    title: "Opportunity Manager", description: "Create and manage job, learnership and programme listings.",
    icon: "Briefcase", color: "bg-primary/10", accentColor: "text-primary",
  },
  manage_learners: {
    component: TeamRosterWidget, layout: "full", persona: "business",
    title: "Learner Roster", description: "Manage learners, track progress and report on outcomes.",
    icon: "Users", color: "bg-primary/10", accentColor: "text-primary",
  },
  learner_pipeline: {
    component: LearnerPipelineWidget, layout: "full", persona: "business",
    title: "Learner Pipeline", description: "Live status of all sponsored learners by province and phase.",
    icon: "Activity", color: "bg-primary/10", accentColor: "text-primary",
  },
  bbee_simulator: {
    component: BEESimulatorWidget, layout: "half", persona: "business",
    title: "B-BBEE Simulator", description: "Interactive 'what-if' scorecard calculator. See exactly how spend moves your level.",
    icon: "TrendingUp", color: "bg-primary/10", accentColor: "text-primary",
  },
  view_reports_bbee: {
    component: BEEEDashboardWidget, layout: "half", persona: "business",
    title: "B-BBEE Dashboard", description: "Real-time B-BBEE scorecard and compliance tracking.",
    icon: "BarChart3", color: "bg-primary/10", accentColor: "text-primary",
  },
  tax_calculator: {
    component: TaxCalculatorWidget, layout: "half", persona: "business",
    title: "Tax Incentive Calculator", description: "Section 12H learnership tax allowance calculator.",
    icon: "Calculator", color: "bg-primary/10", accentColor: "text-primary",
  },
  wsp_reports: {
    component: WSPReportWidget, layout: "half", persona: "business",
    title: "WSP/ATR Reports", description: "One-click WSP/ATR generation formatted to SETA template.",
    icon: "FileText", color: "bg-primary/10", accentColor: "text-primary",
  },
  // SDP-specific
  tender_feed: {
    component: TenderFeedWidget, layout: "full", persona: "business",
    title: "Tender Feed", description: "Live employer requirements — bid or pitch directly to sponsors.",
    icon: "Rss", color: "bg-primary/10", accentColor: "text-primary",
  },
  learner_recruitment: {
    component: LearnerRecruitmentWidget, layout: "full", persona: "business",
    title: "Learner Recruitment Portal", description: "Pool of work-ready unplaced candidates — filter by region, NQF & demographics.",
    icon: "UserSearch", color: "bg-primary/10", accentColor: "text-primary",
  },
  outcome_tracking: {
    component: OutcomeTrackingWidget, layout: "full", persona: "business",
    title: "Outcome Tracking", description: "Pass rates, employment absorption analytics — your proof to attract new sponsors.",
    icon: "BarChart2", color: "bg-primary/10", accentColor: "text-primary",
  },
  manage_procurement: {
    component: ProcurementDashboardWidget, layout: "full", persona: "business",
    title: "Procurement Hub", description: "Order materials, book venues, manage RFQs for your programme schedule.",
    icon: "ShoppingCart", color: "bg-primary/10", accentColor: "text-primary",
  },
  marketplace_listing: {
    component: MarketplaceListingWidget, layout: "full", persona: "business",
    title: "Marketplace Listing", description: "Manage your services in the SkillsMark marketplace.",
    icon: "Store", color: "bg-primary/10", accentColor: "text-primary",
  },
  tender_matching: {
    component: TenderMatchingWidget, layout: "full", persona: "business",
    title: "Tender Matching", description: "Matched government and corporate tender opportunities.",
    icon: "Crosshair", color: "bg-primary/10", accentColor: "text-primary",
  },
  // Support Provider
  procurement_alerts: {
    component: ProcurementAlertsWidget, layout: "full", persona: "business",
    title: "Procurement Alerts", description: "AI-driven demand signals — know what SDPs need before they post.",
    icon: "Bell", color: "bg-primary/10", accentColor: "text-primary",
  },
  rfq_board: {
    component: RFQBoardWidget, layout: "full", persona: "business",
    title: "RFQ Board", description: "Real-time request-for-quote board — SDPs post needs, you quote instantly.",
    icon: "ClipboardList", color: "bg-primary/10", accentColor: "text-primary",
  },
  facility_booking: {
    component: FacilityBookingWidget, layout: "full", persona: "business",
    title: "Facility Booking Calendar", description: "Venue availability calendar with integrated booking and payment.",
    icon: "CalendarCheck", color: "bg-primary/10", accentColor: "text-primary",
  },

// ─── Funding ────────────────────────────────────────────────────────────────
  fund_learners: {
    component: FundingAllocationWidget, layout: "full", persona: "funding",
    title: "Fund Learners", description: "Sponsor skills development and track B-BBEE impact.",
    icon: "DollarSign", color: "bg-primary/10", accentColor: "text-primary",
  },
  manage_funding: {
    component: DisbursementQueueWidget, layout: "half", persona: "funding",
    title: "Funding Allocation", description: "Budget management, disbursement and payment approvals.",
    icon: "PieChart", color: "bg-primary/10", accentColor: "text-primary",
  },
  post_funding_opportunities: {
    component: SponsorOpportunityWidget, layout: "full", persona: "funding",
    title: "Post Funding Briefs", description: "Advertise learnership, internship and bursary programmes. Receive and evaluate provider EOIs.",
    icon: "Megaphone", color: "bg-primary/10", accentColor: "text-primary",
  },
  browse_funding_opportunities: {
    component: FundingOpportunitiesWidget, layout: "full", persona: "business",
    title: "Sponsor Funding Briefs", description: "Discover sponsor-funded programmes and express interest in delivering them.",
    icon: "Banknote", color: "bg-primary/10", accentColor: "text-primary",
  },

  // ── Oversight ──────────────────────────────────────────────────────────────
  verify_documents: {
    component: VerificationQueueWidget, layout: "full", persona: "oversight",
    title: "Verification Queue", description: "Review and action pending document verification requests.",
    icon: "BadgeCheck", color: "bg-primary/10", accentColor: "text-primary",
  },
  view_reports: {
    component: ReportsAnalyticsWidget, layout: "full", persona: "oversight",
    title: "Reports & Analytics", description: "SETA, SARS, B-BBEE and operational dashboards.",
    icon: "BarChart3", color: "bg-primary/10", accentColor: "text-primary",
  },
  view_reports_seta: {
    component: SETAReportingWidget, layout: "full", persona: "oversight",
    title: "SETA Reporting", description: "SETA-specific reporting, exports and compliance monitoring.",
    icon: "FileBarChart", color: "bg-primary/10", accentColor: "text-primary",
  },
  audit_system: {
    component: ComplianceMonitorWidget, layout: "full", persona: "oversight",
    title: "Compliance Monitor", description: "Full audit trails, compliance monitoring and system health.",
    icon: "ShieldAlert", color: "bg-primary/10", accentColor: "text-primary",
  },
  trust_ledger: {
    component: TrustLedgerWidget, layout: "full", persona: "oversight",
    title: "Trust Ledger", description: "Immutable audit trail — QR-verified proof for B-BBEE auditors.",
    icon: "Link2", color: "bg-primary/10", accentColor: "text-primary",
  },
  platform_admin: {
    component: PlatformAdminWidget, layout: "full", persona: "oversight",
    title: "Platform Administration", description: "Users, content moderation and system settings.",
    icon: "Settings", color: "bg-primary/10", accentColor: "text-primary",
  },
  portal_switcher: {
    component: PortalSwitcherWidget, layout: "full", persona: "oversight",
    title: "Portal Switcher", description: "Preview any role's dashboard without switching accounts.",
    icon: "Eye", color: "bg-secondary/10", accentColor: "text-secondary",
  },

  // ── Phase 3 – Glue ─────────────────────────────────────────────────────────
  marketplace_discovery: {
    component: MarketplaceDiscoveryWidget, layout: "full", persona: "business",
    title: "Marketplace Discovery", description: "Powerful search: find accredited SDPs, facilitators, venues and suppliers.",
    icon: "Store", color: "bg-primary/10", accentColor: "text-primary",
  },
  workflow_engine: {
    component: WorkflowEngineWidget, layout: "full", persona: "business",
    title: "Workflow Engine", description: "RFP → bid → award → learner registration → SETA submission in one flow.",
    icon: "GitBranch", color: "bg-primary/10", accentColor: "text-primary",
  },
  multi_company_sponsorship: {
    component: MultiCompanySponsorshipWidget, layout: "full", persona: "business",
    title: "Multi-Company Sponsorship", description: "Manage Lead, Host & Funder companies with cost-sharing and B-BBEE allocation.",
    icon: "Building2", color: "bg-primary/10", accentColor: "text-primary",
  },
};
