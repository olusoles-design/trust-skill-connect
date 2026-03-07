import { useState, useMemo } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Search,
  Settings as SettingsIcon,
  User,
  Bell,
  Palette,
  Globe,
  Monitor,
  KeyRound,
  Shield,
  Users,
  Eye,
  FileCheck,
  Map,
  CreditCard,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

// Settings sections
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { BrandingSettings } from "@/components/settings/BrandingSettings";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { SystemSettings } from "@/components/settings/SystemSettings";
import { AuthenticationSettings } from "@/components/settings/AuthenticationSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { AccessControlSettings } from "@/components/settings/AccessControlSettings";
import { PrivacySettings } from "@/components/settings/PrivacySettings";
import { ComplianceSettings } from "@/components/settings/ComplianceSettings";
import { CountryFrameworkSettings } from "@/components/settings/CountryFrameworkSettings";
import { BillingSettings } from "@/components/settings/BillingSettings";

interface SettingsItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
  adminOnly?: boolean;
}

interface SettingsGroup {
  key: string;
  label: string;
  color: string;
  items: SettingsItem[];
}

const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    key: "account",
    label: "Account",
    color: "text-primary",
    items: [
      { id: "profile",       label: "Profile",        description: "Personal info, avatar, and role badge",     icon: User },
      { id: "notifications", label: "Notifications",  description: "Email and in-app alert preferences",        icon: Bell },
      { id: "billing",       label: "Billing & Plans", description: "Subscriptions, invoices, and payment methods", icon: CreditCard },
    ],
  },
  {
    key: "platform",
    label: "Platform",
    color: "text-gold",
    items: [
      { id: "branding",  label: "Branding",  description: "Logo, colours, and landing page",      icon: Palette, adminOnly: true },
      { id: "general",   label: "General",   description: "Platform name, timezone, and locale",  icon: Globe,   adminOnly: true },
      { id: "system",    label: "System",    description: "Registration, feature flags, and health", icon: Monitor, adminOnly: true, badge: "Admin" },
    ],
  },
  {
    key: "security",
    label: "Security & Access",
    color: "text-destructive",
    items: [
      { id: "authentication", label: "Authentication",  description: "Login methods, SSO, and sessions",          icon: KeyRound },
      { id: "security",       label: "Security",        description: "MFA, password rules, and rate limits",      icon: Shield },
      { id: "access-control", label: "Access Control",  description: "Delegated approvers and SoD controls",      icon: Users, adminOnly: true },
    ],
  },
  {
    key: "compliance",
    label: "Data & Compliance",
    color: "text-accent-foreground",
    items: [
      { id: "privacy",           label: "Privacy",            description: "POPIA, GDPR, and consent management",   icon: Eye },
      { id: "compliance",        label: "Compliance",         description: "ISO 19796 and data retention policies", icon: FileCheck },
      { id: "country-framework", label: "Country Framework",  description: "Countries, regulatory bodies, NQF",    icon: Map },
    ],
  },
];

const ALL_ITEMS = SETTINGS_GROUPS.flatMap((g) => g.items.map((i) => ({ ...i, groupKey: g.key, groupLabel: g.label })));

export default function Settings() {
  const { user, loading, role } = useAuth();
  const [activeId, setActiveId] = useState("profile");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    account: true, platform: true, security: true, compliance: true,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;

  const isAdmin = role === "admin";

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return ALL_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const toggleGroup = (key: string) =>
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const activeItem = ALL_ITEMS.find((i) => i.id === activeId);
  const breadcrumb = activeItem
    ? `Settings › ${SETTINGS_GROUPS.find((g) => g.items.some((i) => i.id === activeId))?.label} › ${activeItem.label}`
    : "Settings";

  const renderContent = () => {
    switch (activeId) {
      case "profile":           return <ProfileSettings />;
      case "notifications":     return <NotificationSettings />;
      case "billing":           return <BillingSettings />;
      case "branding":          return <BrandingSettings />;
      case "general":           return <GeneralSettings />;
      case "system":            return <SystemSettings />;
      case "authentication":    return <AuthenticationSettings />;
      case "security":          return <SecuritySettings />;
      case "access-control":    return <AccessControlSettings />;
      case "privacy":           return <PrivacySettings />;
      case "compliance":        return <ComplianceSettings />;
      case "country-framework": return <CountryFrameworkSettings />;
      default:                  return <ProfileSettings />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-14 flex items-center border-b border-border bg-card px-4 gap-3 sticky top-0 z-10">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground text-sm">Settings</span>
            </div>
            <Separator orientation="vertical" className="h-4 mx-1" />
            <span className="text-xs text-muted-foreground">Manage your account, security, and system preferences</span>
          </header>

          <div className="flex flex-1 min-h-0">
            {/* Settings nav sidebar */}
            <aside className="w-72 border-r border-border bg-card flex flex-col overflow-y-auto shrink-0">
              {/* Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <SettingsIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-base font-semibold text-foreground">Settings</h1>
                    <p className="text-xs text-muted-foreground">Configure your workspace</p>
                  </div>
                </div>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search settings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-8 text-sm bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
              </div>

              {/* Nav items */}
              <nav className="flex-1 p-2 space-y-1">
                {filteredItems ? (
                  filteredItems.length > 0 ? (
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground px-2 py-1">
                        {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""}
                      </p>
                      {filteredItems.map((item) => (
                        <SettingsNavItem
                          key={item.id}
                          item={item}
                          isActive={activeId === item.id}
                          isAdmin={isAdmin}
                          onSelect={(id) => { setActiveId(id); setSearchQuery(""); }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-8">No settings found</p>
                  )
                ) : (
                  SETTINGS_GROUPS.map((group) => {
                    const visibleItems = group.items.filter((i) => !i.adminOnly || isAdmin);
                    if (visibleItems.length === 0) return null;
                    return (
                      <div key={group.key} className="mb-1">
                        <button
                          onClick={() => toggleGroup(group.key)}
                          className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors group"
                        >
                          <span className={cn("text-xs font-semibold uppercase tracking-wider", group.color)}>
                            {group.label}
                          </span>
                          {expandedGroups[group.key] ? (
                            <ChevronDown className="w-3 h-3 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>
                        {expandedGroups[group.key] && (
                          <div className="space-y-0.5 mt-0.5">
                            {visibleItems.map((item) => (
                              <SettingsNavItem
                                key={item.id}
                                item={item}
                                isActive={activeId === item.id}
                                isAdmin={isAdmin}
                                onSelect={setActiveId}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </nav>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto">
              {/* Breadcrumb */}
              <div className="px-6 py-3 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <p className="text-xs text-muted-foreground">{breadcrumb}</p>
              </div>
              <div className="p-6 max-w-4xl">
                {renderContent()}
              </div>
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

function SettingsNavItem({
  item,
  isActive,
  isAdmin,
  onSelect,
}: {
  item: SettingsItem & { groupLabel?: string };
  isActive: boolean;
  isAdmin: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(item.id)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group",
        isActive
          ? "bg-primary/10 text-primary border border-primary/20"
          : "text-foreground hover:bg-muted/60 border border-transparent"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
        isActive ? "bg-primary/15" : "bg-muted group-hover:bg-muted/80"
      )}>
        <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-medium truncate", isActive ? "text-primary" : "text-foreground")}>
            {item.label}
          </span>
          {item.badge && (
            <Badge variant="secondary" className="text-xs py-0 px-1.5 h-4">
              {item.badge}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">{item.description}</p>
      </div>
      {isActive && <ChevronRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
    </button>
  );
}
