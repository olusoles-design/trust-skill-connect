import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Search, FileText, Send, Briefcase, Users, BarChart3, BadgeCheck,
  DollarSign, Store, Crosshair, ShieldCheck, LogOut, User, Home,
  Wallet, Settings, Lock, ToggleRight, FileSignature, TrendingUp,
  Calculator, Rss, UserSearch, BarChart2, ShoppingCart, Bell,
  ClipboardList, CalendarCheck, Activity, GitBranch, Link2,
} from "lucide-react";
import type { Capability } from "@/lib/permissions";
import { Button } from "@/components/ui/button";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  capability: Capability;
}

const ALL_NAV_ITEMS: NavItem[] = [
  // Talent
  { title: "Browse Opportunities",      url: "/dashboard/opportunities",   icon: Search,        capability: "find_opportunities"      },
  { title: "My Applications",           url: "/dashboard/applications",    icon: Send,          capability: "apply_for_opportunities" },
  { title: "My Profile / CV",           url: "/dashboard/profile",         icon: FileText,      capability: "build_profile"           },
  { title: "Document Vault",            url: "/dashboard/vault",           icon: Lock,          capability: "document_vault"          },
  { title: "Availability & Contracts",  url: "/dashboard/availability",    icon: ToggleRight,   capability: "availability_toggle"     },
  { title: "Smart Contracting",         url: "/dashboard/contracting",     icon: FileSignature, capability: "smart_contracting"       },
  // Employer/Sponsor
  { title: "Post Opportunities",        url: "/dashboard/post",            icon: Briefcase,     capability: "post_opportunities"      },
  { title: "Manage Learners",           url: "/dashboard/learners",        icon: Users,         capability: "manage_learners"         },
  { title: "Learner Pipeline",          url: "/dashboard/pipeline",        icon: Activity,      capability: "learner_pipeline"        },
  { title: "B-BBEE Simulator",          url: "/dashboard/bbee",            icon: TrendingUp,    capability: "bbee_simulator"          },
  { title: "Tax Calculator",            url: "/dashboard/tax",             icon: Calculator,    capability: "tax_calculator"          },
  { title: "WSP/ATR Reports",           url: "/dashboard/wsp",             icon: BarChart3,     capability: "wsp_reports"             },
  // SDP
  { title: "Tender Feed",               url: "/dashboard/tender-feed",     icon: Rss,           capability: "tender_feed"             },
  { title: "Learner Recruitment",       url: "/dashboard/recruitment",     icon: UserSearch,    capability: "learner_recruitment"     },
  { title: "Outcome Tracking",          url: "/dashboard/outcomes",        icon: BarChart2,     capability: "outcome_tracking"        },
  { title: "Procurement Hub",           url: "/dashboard/procurement",     icon: ShoppingCart,  capability: "manage_procurement"      },
  // Support Provider
  { title: "Procurement Alerts",        url: "/dashboard/alerts",          icon: Bell,          capability: "procurement_alerts"      },
  { title: "RFQ Board",                 url: "/dashboard/rfq",             icon: ClipboardList, capability: "rfq_board"               },
  { title: "Facility Booking",          url: "/dashboard/booking",         icon: CalendarCheck, capability: "facility_booking"        },
  // Shared Business
  { title: "Fund Learners",             url: "/dashboard/funding",         icon: DollarSign,    capability: "fund_learners"           },
  { title: "Marketplace Listing",       url: "/dashboard/marketplace",     icon: Store,         capability: "marketplace_listing"     },
  { title: "Marketplace Discovery",     url: "/dashboard/discovery",       icon: Search,        capability: "marketplace_discovery"   },
  { title: "Tender Matching",           url: "/dashboard/tenders",         icon: Crosshair,     capability: "tender_matching"         },
  { title: "Workflow Engine",           url: "/dashboard/workflow",        icon: GitBranch,     capability: "workflow_engine"         },
  // Oversight
  { title: "Verify Documents",          url: "/dashboard/verify",          icon: BadgeCheck,    capability: "verify_documents"        },
  { title: "Reports & Analytics",       url: "/dashboard/reports",         icon: BarChart3,     capability: "view_reports"            },
  { title: "Trust Ledger",              url: "/dashboard/ledger",          icon: Link2,         capability: "trust_ledger"            },
  { title: "Platform Admin",            url: "/dashboard/admin",           icon: ShieldCheck,   capability: "platform_admin"          },
];

const PERSONA_LABELS: Record<string, string> = {
  talent:    "Talent Hub",
  business:  "Business Hub",
  funding:   "Funding Hub",
  oversight: "Oversight Hub",
};

const PERSONA_CAPABILITIES: Record<string, Capability[]> = {
  talent:   ["find_opportunities","apply_for_opportunities","build_profile","document_vault","availability_toggle","smart_contracting"],
  business: ["post_opportunities","manage_learners","learner_pipeline","bbee_simulator","tax_calculator","wsp_reports","tender_feed","learner_recruitment","outcome_tracking","manage_procurement","marketplace_listing","marketplace_discovery","tender_matching","procurement_alerts","rfq_board","facility_booking","workflow_engine"],
  funding:  ["fund_learners","manage_funding","approve_payments"],
  oversight:["verify_documents","view_reports","trust_ledger","platform_admin"],
};

export function DashboardSidebar() {
  const { persona, capabilities, signOut, role } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const visibleItems = ALL_NAV_ITEMS.filter(item => capabilities.includes(item.capability));

  const groupedItems = Object.entries(PERSONA_CAPABILITIES)
    .map(([key, caps]) => ({
      key,
      label: PERSONA_LABELS[key],
      items: visibleItems.filter(item => caps.includes(item.capability)),
    }))
    .filter(g => g.items.length > 0);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="w-8 h-8 rounded-lg gradient-teal flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">SkillsMark</p>
              <p className="text-xs text-muted-foreground capitalize truncate">
                {role?.replace(/_/g, " ") ?? "Portal"}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard" end className="hover:bg-sidebar-accent" activeClassName="bg-primary/10 text-primary font-medium">
                    <Home className="w-4 h-4" />
                    {!collapsed && <span>Dashboard Home</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {groupedItems.map(group => (
          <SidebarGroup key={group.key}>
            {!collapsed && (
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(item => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
                      <NavLink to={item.url} className="hover:bg-sidebar-accent text-sidebar-foreground" activeClassName="bg-primary/10 text-primary font-medium">
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={collapsed ? "Profile" : undefined}>
              <NavLink to="/dashboard/profile" className="hover:bg-sidebar-accent text-sidebar-foreground" activeClassName="bg-primary/10 text-primary font-medium">
                <User className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>My Profile</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={collapsed ? "Payments" : undefined}>
              <NavLink to="/dashboard/payments" className="hover:bg-sidebar-accent text-sidebar-foreground" activeClassName="bg-primary/10 text-primary font-medium">
                <Wallet className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>Payments & Wallet</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={collapsed ? "Settings" : undefined}>
              <NavLink to="/dashboard/settings" className="hover:bg-sidebar-accent text-sidebar-foreground" activeClassName="bg-primary/10 text-primary font-medium">
                <Settings className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>Settings</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="hover:bg-destructive/10 hover:text-destructive text-muted-foreground cursor-pointer w-full" tooltip={collapsed ? "Sign out" : undefined}>
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
