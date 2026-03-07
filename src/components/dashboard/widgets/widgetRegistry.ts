/**
 * Widget Registry
 *
 * Maps each Capability to:
 *   - The React component that renders it
 *   - Its layout width: "full" | "half" | "third"
 *   - Its display persona (for section grouping)
 *   - A human label and description
 *
 * To add a new widget: import its component and add one entry here.
 * Nothing in WidgetGrid.tsx needs to change.
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

// ─── Business
import { OpportunityManagerWidget }    from "./business/OpportunityManagerWidget";
import { TeamRosterWidget }            from "./business/TeamRosterWidget";
import { BEEEDashboardWidget }         from "./business/BEEEDashboardWidget";
import { ProcurementDashboardWidget }  from "./business/ProcurementDashboardWidget";
import { MarketplaceListingWidget }    from "./business/MarketplaceListingWidget";
import { TenderMatchingWidget }        from "./business/TenderMatchingWidget";
import { TaskPosterWidget }            from "./business/TaskPosterWidget";

// ─── Funding
import { FundingAllocationWidget }     from "./funding/FundingAllocationWidget";
import { DisbursementQueueWidget }     from "./funding/DisbursementQueueWidget";

// ─── Oversight
import { VerificationQueueWidget }     from "./oversight/VerificationQueueWidget";
import { ReportsAnalyticsWidget }      from "./oversight/ReportsAnalyticsWidget";
import { SETAReportingWidget }         from "./oversight/SETAReportingWidget";
import { ComplianceMonitorWidget }     from "./oversight/ComplianceMonitorWidget";
import { PlatformAdminWidget }         from "./oversight/PlatformAdminWidget";

// ─── Types ────────────────────────────────────────────────────────────────────

export type WidgetLayout = "full" | "half" | "third";
export type WidgetPersona = "talent" | "business" | "funding" | "oversight";

export interface WidgetMeta {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>;
  layout: WidgetLayout;
  persona: WidgetPersona;
  title: string;
  description: string;
  icon: string;           // lucide icon name for reference
  color: string;          // tailwind bg utility
  accentColor: string;    // tailwind text utility
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const WIDGET_REGISTRY: Partial<Record<Capability, WidgetMeta>> = {

  // ── Talent ─────────────────────────────────────────────────────────────────
  find_opportunities: {
    component:   BrowseOpportunitiesWidget,
    layout:      "full",
    persona:     "talent",
    title:       "Browse Opportunities",
    description: "Discover learnerships, jobs, gigs and programmes.",
    icon:        "Search",
    color:       "bg-primary/10",
    accentColor: "text-primary",
  },
  apply_for_opportunities: {
    component:   MyApplicationsWidget,
    layout:      "full",
    persona:     "talent",
    title:       "My Applications",
    description: "Track all your submitted applications and bids.",
    icon:        "Send",
    color:       "bg-primary/10",
    accentColor: "text-primary",
  },
  build_profile: {
    component:   ProfileCVWidget,
    layout:      "half",
    persona:     "talent",
    title:       "Profile & Digital CV",
    description: "Build a verified professional profile and preview your digital CV.",
    icon:        "FileText",
    color:       "bg-primary/10",
    accentColor: "text-primary",
  },
  track_progress: {
    component:   LearningProgressWidget,
    layout:      "half",
    persona:     "talent",
    title:       "Learning Progress",
    description: "Track your current programme milestones and completion.",
    icon:        "TrendingUp",
    color:       "bg-primary/10",
    accentColor: "text-primary",
  },
  view_credentials: {
    component:   CredentialWalletWidget,
    layout:      "half",
    persona:     "talent",
    title:       "Credential Wallet",
    description: "Your digital badges, certificates and verified qualifications.",
    icon:        "Award",
    color:       "bg-primary/10",
    accentColor: "text-primary",
  },
  view_tasks: {
    component:   MicroTaskBoardWidget,
    layout:      "full",
    persona:     "talent",
    title:       "Micro-Task Board",
    description: "Find short-term tasks and gigs for immediate income.",
    icon:        "ListTodo",
    color:       "bg-primary/10",
    accentColor: "text-primary",
  },
  my_tasks: {
    component:   MyTasksWidget,
    layout:      "half",
    persona:     "talent",
    title:       "My Tasks & Earnings",
    description: "Track completed tasks, earnings history, and quality ratings.",
    icon:        "Wallet",
    color:       "bg-primary/10",
    accentColor: "text-primary",
  },

  // ── Business ───────────────────────────────────────────────────────────────
  post_tasks: {
    component:   TaskPosterWidget,
    layout:      "half",
    persona:     "business",
    title:       "Task Poster",
    description: "Post micro-tasks, review worker submissions, and manage payouts.",
    icon:        "ListTodo",
    color:       "bg-accent/20",
    accentColor: "text-accent-foreground",
  },
  post_opportunities: {
    component:   OpportunityManagerWidget,
    layout:      "full",
    persona:     "business",
    title:       "Opportunity Manager",
    description: "Create and manage your job, learnership and programme listings.",
    icon:        "Briefcase",
    color:       "bg-accent/20",
    accentColor: "text-accent-foreground",
  },
  manage_learners: {
    component:   TeamRosterWidget,
    layout:      "full",
    persona:     "business",
    title:       "Learner Roster",
    description: "Manage learners, track progress and report on outcomes.",
    icon:        "Users",
    color:       "bg-accent/20",
    accentColor: "text-accent-foreground",
  },
  view_reports_bbee: {
    component:   BEEEDashboardWidget,
    layout:      "full",
    persona:     "business",
    title:       "B-BBEE Dashboard",
    description: "Real-time scorecard, ETI calculator and compliance status.",
    icon:        "PieChart",
    color:       "bg-accent/20",
    accentColor: "text-accent-foreground",
  },
  manage_procurement: {
    component:   ProcurementDashboardWidget,
    layout:      "full",
    persona:     "business",
    title:       "Procurement Dashboard",
    description: "Manage RFQs, supplier responses and purchase orders.",
    icon:        "ShoppingCart",
    color:       "bg-accent/20",
    accentColor: "text-accent-foreground",
  },
  marketplace_listing: {
    component:   MarketplaceListingWidget,
    layout:      "half",
    persona:     "business",
    title:       "Marketplace Listing",
    description: "Manage your services in the SkillsMark marketplace.",
    icon:        "Store",
    color:       "bg-accent/20",
    accentColor: "text-accent-foreground",
  },
  tender_matching: {
    component:   TenderMatchingWidget,
    layout:      "half",
    persona:     "business",
    title:       "Tender Matching",
    description: "Matched government and corporate tender opportunities.",
    icon:        "Crosshair",
    color:       "bg-accent/20",
    accentColor: "text-accent-foreground",
  },

  // ── Funding ────────────────────────────────────────────────────────────────
  fund_learners: {
    component:   FundingAllocationWidget,
    layout:      "full",
    persona:     "funding",
    title:       "Fund Learners",
    description: "Sponsor skills development and track B-BBEE impact.",
    icon:        "DollarSign",
    color:       "bg-secondary/10",
    accentColor: "text-secondary-foreground",
  },
  manage_funding: {
    component:   FundingAllocationWidget,
    layout:      "full",
    persona:     "funding",
    title:       "Funding Allocation",
    description: "Budget vs actual spend across skills development pools.",
    icon:        "Wallet",
    color:       "bg-secondary/10",
    accentColor: "text-secondary-foreground",
  },
  approve_payments: {
    component:   DisbursementQueueWidget,
    layout:      "half",
    persona:     "funding",
    title:       "Disbursement Queue",
    description: "Review and approve pending learner payments.",
    icon:        "CreditCard",
    color:       "bg-secondary/10",
    accentColor: "text-secondary-foreground",
  },

  // ── Oversight ──────────────────────────────────────────────────────────────
  verify_documents: {
    component:   VerificationQueueWidget,
    layout:      "full",
    persona:     "oversight",
    title:       "Verification Queue",
    description: "Review and action pending document verification requests.",
    icon:        "BadgeCheck",
    color:       "bg-destructive/10",
    accentColor: "text-destructive",
  },
  view_reports: {
    component:   ReportsAnalyticsWidget,
    layout:      "full",
    persona:     "oversight",
    title:       "Reports & Analytics",
    description: "SETA, SARS, B-BBEE and operational dashboards.",
    icon:        "BarChart3",
    color:       "bg-destructive/10",
    accentColor: "text-destructive",
  },
  view_reports_seta: {
    component:   SETAReportingWidget,
    layout:      "full",
    persona:     "oversight",
    title:       "SETA Reporting",
    description: "One-click compliance reports for SETA submission.",
    icon:        "FileBarChart",
    color:       "bg-destructive/10",
    accentColor: "text-destructive",
  },
  audit_system: {
    component:   ComplianceMonitorWidget,
    layout:      "half",
    persona:     "oversight",
    title:       "Compliance Monitor",
    description: "Expiring credentials, upcoming deadlines and audit trails.",
    icon:        "ShieldAlert",
    color:       "bg-destructive/10",
    accentColor: "text-destructive",
  },
  platform_admin: {
    component:   PlatformAdminWidget,
    layout:      "full",
    persona:     "oversight",
    title:       "Platform Administration",
    description: "Users, content moderation and system settings.",
    icon:        "ShieldCheck",
    color:       "bg-destructive/10",
    accentColor: "text-destructive",
  },
};
