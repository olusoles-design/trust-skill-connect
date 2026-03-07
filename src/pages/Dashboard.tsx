import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { WidgetGrid } from "@/components/dashboard/WidgetGrid";
import { Navigate, Routes, Route } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// ── Widget imports ────────────────────────────────────────────────────────────
import { BrowseOpportunitiesWidget }  from "@/components/dashboard/widgets/BrowseOpportunitiesWidget";
import { MyApplicationsWidget }       from "@/components/dashboard/widgets/talent/MyApplicationsWidget";
import { ProfileCVWidget }            from "@/components/dashboard/widgets/talent/ProfileCVWidget";
import { OpportunityManagerWidget }   from "@/components/dashboard/widgets/business/OpportunityManagerWidget";
import { TeamRosterWidget }           from "@/components/dashboard/widgets/business/TeamRosterWidget";
import { FundingAllocationWidget }    from "@/components/dashboard/widgets/funding/FundingAllocationWidget";
import { VerificationQueueWidget }    from "@/components/dashboard/widgets/oversight/VerificationQueueWidget";
import { ReportsAnalyticsWidget }     from "@/components/dashboard/widgets/oversight/ReportsAnalyticsWidget";
import { MarketplaceListingWidget }   from "@/components/dashboard/widgets/business/MarketplaceListingWidget";
import { TenderMatchingWidget }       from "@/components/dashboard/widgets/business/TenderMatchingWidget";
import { PlatformAdminWidget }        from "@/components/dashboard/widgets/oversight/PlatformAdminWidget";

// ── Page wrapper (back button + title bar) ────────────────────────────────────
function PageView({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

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

              {/* Talent Hub */}
              <Route path="opportunities" element={
                <PageView title="Browse Opportunities" description="Discover learnerships, jobs, gigs and programmes.">
                  <BrowseOpportunitiesWidget />
                </PageView>
              } />
              <Route path="applications" element={
                <PageView title="My Applications" description="Track all your submitted applications and bids.">
                  <MyApplicationsWidget />
                </PageView>
              } />
              <Route path="profile" element={
                <PageView title="Profile & Digital CV" description="Build a verified professional profile and preview your digital CV.">
                  <ProfileCVWidget />
                </PageView>
              } />

              {/* Business Hub */}
              <Route path="post" element={
                <PageView title="Opportunity Manager" description="Create and manage your job, learnership and programme listings.">
                  <OpportunityManagerWidget />
                </PageView>
              } />
              <Route path="learners" element={
                <PageView title="Learner Roster" description="Manage learners, track progress and report on outcomes.">
                  <TeamRosterWidget />
                </PageView>
              } />
              <Route path="marketplace" element={
                <PageView title="Marketplace Listing" description="Manage your services in the SkillsMark marketplace.">
                  <MarketplaceListingWidget />
                </PageView>
              } />
              <Route path="tenders" element={
                <PageView title="Tender Matching" description="Matched government and corporate tender opportunities.">
                  <TenderMatchingWidget />
                </PageView>
              } />

              {/* Funding Hub */}
              <Route path="funding" element={
                <PageView title="Fund Learners" description="Sponsor skills development and track B-BBEE impact.">
                  <FundingAllocationWidget />
                </PageView>
              } />

              {/* Oversight Hub */}
              <Route path="verify" element={
                <PageView title="Verification Queue" description="Review and action pending document verification requests.">
                  <VerificationQueueWidget />
                </PageView>
              } />
              <Route path="reports" element={
                <PageView title="Reports & Analytics" description="SETA, SARS, B-BBEE and operational dashboards.">
                  <ReportsAnalyticsWidget />
                </PageView>
              } />
              <Route path="admin" element={
                <PageView title="Platform Administration" description="Users, content moderation and system settings.">
                  <PlatformAdminWidget />
                </PageView>
              } />

              {/* Fallback */}
              <Route path="*" element={<WidgetGrid />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
