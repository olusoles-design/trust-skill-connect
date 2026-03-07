import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { WidgetGrid } from "@/components/dashboard/WidgetGrid";
import { Navigate, Routes, Route } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Talent
import { BrowseOpportunitiesWidget }  from "@/components/dashboard/widgets/BrowseOpportunitiesWidget";
import { MyApplicationsWidget }       from "@/components/dashboard/widgets/talent/MyApplicationsWidget";
import { ProfileCVWidget }            from "@/components/dashboard/widgets/talent/ProfileCVWidget";
import { DocumentVaultWidget }        from "@/components/dashboard/widgets/talent/DocumentVaultWidget";
import { AvailabilityToggleWidget }   from "@/components/dashboard/widgets/talent/AvailabilityToggleWidget";
import { SmartContractingWidget }     from "@/components/dashboard/widgets/talent/SmartContractingWidget";
// Business – Employer/Sponsor
import { OpportunityManagerWidget }   from "@/components/dashboard/widgets/business/OpportunityManagerWidget";
import { TeamRosterWidget }           from "@/components/dashboard/widgets/business/TeamRosterWidget";
import { LearnerPipelineWidget }      from "@/components/dashboard/widgets/business/LearnerPipelineWidget";
import { BEESimulatorWidget }         from "@/components/dashboard/widgets/business/BEESimulatorWidget";
import { TaxCalculatorWidget }        from "@/components/dashboard/widgets/business/TaxCalculatorWidget";
import { WSPReportWidget }            from "@/components/dashboard/widgets/business/WSPReportWidget";
// SDP
import { TenderFeedWidget }           from "@/components/dashboard/widgets/business/TenderFeedWidget";
import { LearnerRecruitmentWidget }   from "@/components/dashboard/widgets/business/LearnerRecruitmentWidget";
import { OutcomeTrackingWidget }      from "@/components/dashboard/widgets/business/OutcomeTrackingWidget";
import { ProcurementDashboardWidget } from "@/components/dashboard/widgets/business/ProcurementDashboardWidget";
// Support Provider
import { ProcurementAlertsWidget }    from "@/components/dashboard/widgets/business/ProcurementAlertsWidget";
import { RFQBoardWidget }             from "@/components/dashboard/widgets/business/RFQBoardWidget";
import { FacilityBookingWidget }      from "@/components/dashboard/widgets/business/FacilityBookingWidget";
// Shared
import { MarketplaceListingWidget }   from "@/components/dashboard/widgets/business/MarketplaceListingWidget";
import { MarketplaceDiscoveryWidget } from "@/components/dashboard/widgets/business/MarketplaceDiscoveryWidget";
import { TenderMatchingWidget }       from "@/components/dashboard/widgets/business/TenderMatchingWidget";
import { WorkflowEngineWidget }       from "@/components/dashboard/widgets/business/WorkflowEngineWidget";
// Funding
import { FundingAllocationWidget }    from "@/components/dashboard/widgets/funding/FundingAllocationWidget";
// Oversight
import { VerificationQueueWidget }    from "@/components/dashboard/widgets/oversight/VerificationQueueWidget";
import { ReportsAnalyticsWidget }     from "@/components/dashboard/widgets/oversight/ReportsAnalyticsWidget";
import { PlatformAdminWidget }        from "@/components/dashboard/widgets/oversight/PlatformAdminWidget";
import { TrustLedgerWidget }          from "@/components/dashboard/widgets/oversight/TrustLedgerWidget";
import { PortalSwitcherWidget }       from "@/components/dashboard/widgets/oversight/PortalSwitcherWidget";

function PageView({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Dashboard
      </button>
      <div className="pb-2 border-b border-border">
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  if (!user) return <Navigate to="/" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border bg-card px-4 gap-3 sticky top-0 z-10">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <DashboardHeader />
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route index element={<WidgetGrid />} />

              {/* Talent */}
              <Route path="opportunities" element={<PageView title="Browse Opportunities" description="Discover learnerships, jobs, gigs and programmes."><BrowseOpportunitiesWidget /></PageView>} />
              <Route path="applications"  element={<PageView title="My Applications" description="Track all your submitted applications and bids."><MyApplicationsWidget /></PageView>} />
              <Route path="profile"       element={<PageView title="Profile & Digital CV" description="Build a verified professional profile."><ProfileCVWidget /></PageView>} />
              <Route path="vault"         element={<PageView title="Document Vault" description="Securely store compliance documents with expiry tracking."><DocumentVaultWidget /></PageView>} />
              <Route path="availability"  element={<PageView title="Availability & Contracts" description="Toggle availability, view contracts and reputation score."><AvailabilityToggleWidget /></PageView>} />
              <Route path="contracting"   element={<PageView title="Smart Contracting" description="Digital timesheets, geo clock-in/out and SLA templates."><SmartContractingWidget /></PageView>} />

              {/* Employer/Sponsor */}
              <Route path="post"      element={<PageView title="Opportunity Manager" description="Create and manage job, learnership and programme listings."><OpportunityManagerWidget /></PageView>} />
              <Route path="learners"  element={<PageView title="Learner Roster" description="Manage learners, track progress and report on outcomes."><TeamRosterWidget /></PageView>} />
              <Route path="pipeline"  element={<PageView title="Learner Pipeline" description="Live status of all sponsored learners by province and phase."><LearnerPipelineWidget /></PageView>} />
              <Route path="bbee"      element={<PageView title="B-BBEE Simulator" description="Interactive what-if calculator — see how spend moves your level."><BEESimulatorWidget /></PageView>} />
              <Route path="tax"       element={<PageView title="Tax Incentive Calculator" description="Section 12H learnership tax allowance calculator."><TaxCalculatorWidget /></PageView>} />
              <Route path="wsp"       element={<PageView title="WSP/ATR Reports" description="One-click report generation formatted to SETA template."><WSPReportWidget /></PageView>} />

              {/* SDP */}
              <Route path="tender-feed"   element={<PageView title="Tender Feed" description="Live employer requirements — bid or pitch directly to sponsors."><TenderFeedWidget /></PageView>} />
              <Route path="recruitment"   element={<PageView title="Learner Recruitment Portal" description="Work-ready candidate pool — filter by region, NQF & demographics."><LearnerRecruitmentWidget /></PageView>} />
              <Route path="outcomes"      element={<PageView title="Outcome Tracking" description="Pass rates and employment absorption analytics."><OutcomeTrackingWidget /></PageView>} />
              <Route path="procurement"   element={<PageView title="Procurement Hub" description="Order materials, book venues, manage RFQs."><ProcurementDashboardWidget /></PageView>} />

              {/* Support Provider */}
              <Route path="alerts"    element={<PageView title="Procurement Alerts" description="AI-driven demand signals — know what SDPs need before they post."><ProcurementAlertsWidget /></PageView>} />
              <Route path="rfq"       element={<PageView title="RFQ Board" description="SDPs post needs, you quote instantly."><RFQBoardWidget /></PageView>} />
              <Route path="booking"   element={<PageView title="Facility Booking Calendar" description="Venue availability with integrated booking and payment."><FacilityBookingWidget /></PageView>} />

              {/* Shared */}
              <Route path="marketplace" element={<PageView title="Marketplace Listing" description="Manage your services in the SkillsMark marketplace."><MarketplaceListingWidget /></PageView>} />
              <Route path="discovery"   element={<PageView title="Marketplace Discovery" description="Find accredited SDPs, facilitators, venues and suppliers."><MarketplaceDiscoveryWidget /></PageView>} />
              <Route path="tenders"     element={<PageView title="Tender Matching" description="Matched government and corporate tender opportunities."><TenderMatchingWidget /></PageView>} />
              <Route path="funding"     element={<PageView title="Fund Learners" description="Sponsor skills development and track B-BBEE impact."><FundingAllocationWidget /></PageView>} />
              <Route path="workflow"    element={<PageView title="Workflow Engine" description="RFP → bid → award → learner registration → SETA packet."><WorkflowEngineWidget /></PageView>} />

              {/* Oversight */}
              <Route path="verify"  element={<PageView title="Verification Queue" description="Review and action pending document verification requests."><VerificationQueueWidget /></PageView>} />
              <Route path="reports" element={<PageView title="Reports & Analytics" description="SETA, SARS, B-BBEE and operational dashboards."><ReportsAnalyticsWidget /></PageView>} />
              <Route path="ledger"  element={<PageView title="Trust Ledger" description="Immutable audit trail with QR verification for B-BBEE audits."><TrustLedgerWidget /></PageView>} />
              <Route path="admin"   element={<PageView title="Platform Administration" description="Users, content moderation and system settings."><PlatformAdminWidget /></PageView>} />

              <Route path="*" element={<WidgetGrid />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
