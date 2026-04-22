import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search, UserCog, ShieldCheck, RefreshCw, UserPlus, Mail, Phone,
  Calendar, Clock, Shield, Users, ChevronRight, User, CheckCircle2,
  XCircle, AlertTriangle, MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type AppRole = Database["public"]["Enums"]["app_role"];

const ROLE_FILTERS: { label: string; roles: AppRole[]; key: string }[] = [
  { key: "all",          label: "All Users",    roles: [] },
  { key: "learner",      label: "Learners",     roles: ["learner"] },
  { key: "sponsor",      label: "Sponsors",     roles: ["sponsor"] },
  { key: "provider",     label: "SDPs",         roles: ["provider"] },
  { key: "practitioner", label: "Practitioners",roles: ["practitioner"] },
  { key: "support_provider", label: "Suppliers",roles: ["support_provider"] },
  { key: "admin",        label: "Admins",       roles: ["admin"] },
];

const ALL_ROLES: AppRole[] = [
  "learner","practitioner","employer","provider","sponsor","fundi",
  "support_provider","seta","government","admin"
];

const ROLE_COLORS: Record<string, string> = {
  learner:          "bg-primary/10 text-primary border border-primary/20",
  practitioner:     "bg-accent/10 text-accent-foreground border border-accent/20",
  employer:         "bg-success/10 text-success border border-success/20",
  provider:         "bg-warning/10 text-warning border border-warning/20",
  sponsor:          "bg-primary/10 text-primary border border-primary/20",
  fundi:            "bg-accent/10 text-accent-foreground border border-accent/20",
  support_provider: "bg-muted/50 text-muted-foreground border border-border",
  seta:             "bg-destructive/10 text-destructive border border-destructive/20",
  government:       "bg-destructive/10 text-destructive border border-destructive/20",
  admin:            "bg-destructive/15 text-destructive border border-destructive/30 font-semibold",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active:    { label: "Active",    color: "text-success",     icon: <CheckCircle2 className="w-3 h-3" /> },
  verified:  { label: "Verified",  color: "text-success",     icon: <CheckCircle2 className="w-3 h-3" /> },
  suspended: { label: "Suspended", color: "text-destructive", icon: <XCircle className="w-3 h-3" /> },
  pending:   { label: "Pending",   color: "text-warning",     icon: <AlertTriangle className="w-3 h-3" /> },
};

interface UserRow {
  user_id: string;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  location: string | null;
  job_title: string | null;
  company_name: string | null;
  roles: AppRole[];
  created_at: string;
  status: string;
}

function getUserInitials(user: UserRow): string {
  if (user.first_name || user.last_name) {
    return `${(user.first_name ?? "")[0] ?? ""}${(user.last_name ?? "")[0] ?? ""}`.toUpperCase() || "?";
  }
  return user.user_id.slice(0, 2).toUpperCase();
}

function AvatarCircle({ user, size = "md" }: { user: UserRow; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-14 h-14 text-lg" : "w-10 h-10 text-sm";
  if (user.avatar_url) {
    return <img src={user.avatar_url} className={cn(sz, "rounded-full object-cover flex-shrink-0")} alt="" />;
  }
  return (
    <div className={cn(sz, "rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center flex-shrink-0")}>
      {getUserInitials(user)}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function ManageUsersWidget() {
  const qc = useQueryClient();
  const [search, setSearch]             = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [editUser, setEditUser]         = useState<UserRow | null>(null);
  const [addRole, setAddRole]           = useState<AppRole>("learner");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const { data: users = [], isLoading, refetch } = useQuery<UserRow[]>({
    queryKey: ["manage-users"],
    queryFn: async () => {
      const [{ data: roles, error: rolesErr }, { data: profiles }] = await Promise.all([
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("profiles").select("user_id, first_name, last_name, phone, avatar_url, location, job_title, company_name, created_at"),
      ]);
      if (rolesErr) throw rolesErr;

      const rolesByUser = new Map<string, AppRole[]>();
      for (const r of roles ?? []) {
        rolesByUser.set(r.user_id, [...(rolesByUser.get(r.user_id) ?? []), r.role as AppRole]);
      }

      const map = new Map<string, UserRow>();
      for (const p of profiles ?? []) {
        const firstName = p.first_name ?? null;
        const lastName  = p.last_name  ?? null;
        const displayName = firstName || lastName
          ? `${firstName ?? ""} ${lastName ?? ""}`.trim()
          : `User ${p.user_id.slice(0, 8)}`;

        map.set(p.user_id, {
          user_id: p.user_id,
          display_name: displayName,
          first_name: firstName,
          last_name: lastName,
          phone: p.phone ?? null,
          avatar_url: p.avatar_url ?? null,
          location: p.location ?? null,
          job_title: p.job_title ?? null,
          company_name: p.company_name ?? null,
          roles: rolesByUser.get(p.user_id) ?? [],
          created_at: p.created_at ?? new Date().toISOString(),
          status: "active",
        });
      }

      for (const [userId, userRoles] of rolesByUser) {
        if (!map.has(userId)) {
          map.set(userId, {
            user_id: userId,
            display_name: `User ${userId.slice(0, 8)}`,
            first_name: null,
            last_name: null,
            phone: null,
            avatar_url: null,
            location: null,
            job_title: null,
            company_name: null,
            roles: userRoles,
            created_at: new Date().toISOString(),
            status: "active",
          });
        }
      }

      return Array.from(map.values()).sort((a, b) => a.display_name.localeCompare(b.display_name));
    },
  });

  // Auto-select first user when data loads
  useEffect(() => {
    if (users.length > 0 && !selectedUser) setSelectedUser(users[0]);
  }, [users]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const addRoleMut = useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").insert({ user_id, role });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["manage-users"] }); toast.success("Role added"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeRoleMut = useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", user_id).eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["manage-users"] }); toast.success("Role removed"); },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    const roleFilter = ROLE_FILTERS.find(f => f.key === activeFilter);
    return users.filter((u: UserRow) => {
      const matchSearch = !term ||
        u.display_name.toLowerCase().includes(term) ||
        u.user_id.toLowerCase().includes(term);
      const matchRole = !roleFilter || roleFilter.roles.length === 0 ||
        u.roles.some(r => roleFilter.roles.includes(r));
      return matchSearch && matchRole;
    });
  }, [users, search, activeFilter]);

  const filterCount = useMemo(() => {
    return Object.fromEntries(ROLE_FILTERS.map(f => [
      f.key,
      f.roles.length === 0
        ? (users as UserRow[]).length
        : (users as UserRow[]).filter((u: UserRow) => u.roles.some(r => f.roles.includes(r))).length
    ]));
  }, [users]);

  // ── Derived status ─────────────────────────────────────────────────────────
  function getStatus(user: UserRow): string {
    if (user.roles.includes("admin")) return "verified";
    return user.status ?? "active";
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 border border-border">
          <Users className="w-3.5 h-3.5" />
          <span>{filtered.length} users found in this category</span>
        </div>
        <Button size="sm" variant="outline" className="h-9 text-xs gap-1.5" onClick={() => refetch()}>
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Role filter pills */}
      <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-border bg-card">
        {ROLE_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
              activeFilter === f.key
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-foreground border-border hover:border-primary/40 hover:bg-primary/5"
            )}
          >
            <Shield className="w-3 h-3" />
            {f.label}
            <span className={cn(
              "text-[10px] rounded-full px-1.5 py-0.5 font-semibold",
              activeFilter === f.key ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"
            )}>
              {filterCount[f.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Split-screen: list + detail */}
      <div className="flex gap-4 rounded-xl border border-border overflow-hidden bg-card min-h-[500px]">
        {/* Left: User list */}
        <div className="w-full md:w-[55%] border-r border-border flex flex-col">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr] gap-2 px-4 py-2.5 bg-muted/30 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            <span>Full Name</span>
            <span>Contact Information</span>
            <span>Status</span>
            <span>Join Date</span>
          </div>

          {/* Rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/50">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-muted rounded w-32" />
                    <div className="h-2.5 bg-muted rounded w-20" />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                <Users className="w-8 h-8 opacity-30" />
                <p className="text-sm">No users found</p>
              </div>
            ) : filtered.map(u => {
              const status = getStatus(u);
              const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.active;
              const isSelected = selectedUser?.user_id === u.user_id;
              return (
                <button
                  key={u.user_id}
                  onClick={() => setSelectedUser(u)}
                  className={cn(
                    "w-full grid grid-cols-[2fr_2fr_1fr_1fr] gap-2 px-4 py-3 text-left transition-colors hover:bg-primary/5 group",
                    isSelected && "bg-primary/8 border-l-2 border-l-primary"
                  )}
                >
                  {/* Full Name */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AvatarCircle user={u} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{u.display_name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-muted-foreground font-mono">ID: {u.user_id.slice(0, 8)}</span>
                        {u.roles.includes("admin") && (
                          <span className="text-[9px] px-1 py-px rounded bg-destructive/10 text-destructive font-semibold">Suspended</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Contact */}
                  <div className="flex flex-col justify-center gap-0.5 min-w-0">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Mail className="w-2.5 h-2.5 flex-shrink-0" />
                      <span className="truncate">{u.display_name.includes("@") ? u.display_name : `${u.user_id.slice(0,8)}@platform`}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Phone className="w-2.5 h-2.5 flex-shrink-0" />
                      <span>{u.phone ?? "No phone"}</span>
                    </div>
                  </div>
                  {/* Status */}
                  <div className="flex flex-col justify-center">
                    <div className={cn("flex items-center gap-1 text-[10px] font-medium", statusCfg.color)}>
                      {statusCfg.icon}
                      {statusCfg.label}
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      {u.created_at ? format(new Date(u.created_at), "MMM d, HH:mm") : "—"}
                    </p>
                  </div>
                  {/* Join date */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {u.created_at ? format(new Date(u.created_at), "d MMM yyyy") : "—"}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs">
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); setEditUser(u); }}>
                          <ShieldCheck className="w-3.5 h-3.5 mr-2" /> Manage Roles
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          {(filtered as UserRow[]).length > 0 && (
            <div className="px-4 py-2 border-t border-border bg-muted/20 text-[10px] text-muted-foreground">
              Showing {(filtered as UserRow[]).length} of {(users as UserRow[]).length} users
            </div>
          )}
        </div>

        {/* Right: User detail panel */}
        <div className="hidden md:flex flex-col flex-1 min-w-0">
          {selectedUser ? (
            <UserDetailPanel
              user={selectedUser}
              getStatus={getStatus}
              onManageRoles={() => setEditUser(selectedUser)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <User className="w-10 h-10 opacity-20" />
              <p className="text-sm">Select a user to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Role Management Dialog */}
      <Dialog open={!!editUser} onOpenChange={open => !open && setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Manage Roles — {editUser?.display_name}
            </DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/40 px-3 py-2 flex items-center gap-3">
                <AvatarCircle user={editUser} size="sm" />
                <div>
                  <p className="text-xs font-medium text-foreground">{editUser.display_name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{editUser.user_id}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Current Roles</p>
                <div className="flex flex-wrap gap-1.5">
                  {editUser.roles.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">No roles assigned</span>
                  ) : editUser.roles.map(r => (
                    <div key={r} className={cn("flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-medium capitalize", ROLE_COLORS[r])}>
                      {r.replace(/_/g, " ")}
                      <button
                        className="ml-1 hover:text-destructive transition-colors font-bold"
                        onClick={() => {
                          removeRoleMut.mutate({ user_id: editUser.user_id, role: r });
                          setEditUser(prev => prev ? { ...prev, roles: prev.roles.filter(x => x !== r) } : null);
                        }}
                      >×</button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Add Role</p>
                <div className="flex gap-2">
                  <Select value={addRole} onValueChange={v => setAddRole(v as AppRole)}>
                    <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALL_ROLES.filter(r => !editUser.roles.includes(r)).map(r => (
                        <SelectItem key={r} value={r} className="capitalize text-xs">{r.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm" className="h-8 text-xs gap-1.5"
                    disabled={addRoleMut.isPending || editUser.roles.includes(addRole)}
                    onClick={() => {
                      addRoleMut.mutate({ user_id: editUser.user_id, role: addRole });
                      setEditUser(prev => prev ? { ...prev, roles: [...prev.roles, addRole] } : null);
                    }}
                  >
                    <UserPlus className="w-3 h-3" /> Add
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setEditUser(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── User Detail Panel ────────────────────────────────────────────────────────
function UserDetailPanel({
  user, getStatus, onManageRoles
}: {
  user: UserRow;
  getStatus: (u: UserRow) => string;
  onManageRoles: () => void;
}) {
  const status = getStatus(user);
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.active;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-5 border-b border-border bg-muted/20">
        <div className="flex items-start gap-4">
          <AvatarCircle user={user} size="lg" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm">{user.display_name}</h3>
            {user.job_title && <p className="text-xs text-muted-foreground">{user.job_title}</p>}
            {user.company_name && <p className="text-xs text-muted-foreground">{user.company_name}</p>}
            <div className="flex flex-wrap gap-1 mt-2">
              {user.roles.map(r => (
                <span key={r} className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium capitalize", ROLE_COLORS[r])}>
                  {r.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 flex-shrink-0" onClick={onManageRoles}>
            <ShieldCheck className="w-3 h-3" /> Roles
          </Button>
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 p-5 space-y-5">
        {/* ID */}
        <DetailSection icon={<UserCog className="w-3.5 h-3.5" />} label="User ID">
          <code className="text-[10px] font-mono text-muted-foreground break-all">{user.user_id}</code>
        </DetailSection>

        {/* Contact */}
        <DetailSection icon={<Mail className="w-3.5 h-3.5" />} label="Contact Information">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-foreground">
              <Mail className="w-3 h-3 text-muted-foreground" />
              <span>{user.display_name.includes("@") ? user.display_name : `${user.user_id.slice(0,8)}@platform.local`}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="w-3 h-3" />
              <span>{user.phone ?? "No phone"}</span>
            </div>
            {user.location && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ChevronRight className="w-3 h-3" />
                <span>{user.location}</span>
              </div>
            )}
          </div>
        </DetailSection>

        {/* Status */}
        <DetailSection icon={<Shield className="w-3.5 h-3.5" />} label="Status">
          <div className="flex items-center gap-2">
            <div className={cn("flex items-center gap-1.5 text-xs font-semibold", statusCfg.color)}>
              {statusCfg.icon}
              {statusCfg.label}
            </div>
            {user.created_at && (
              <span className="text-[10px] text-muted-foreground">
                · {format(new Date(user.created_at), "MMM d, HH:mm")}
              </span>
            )}
          </div>
        </DetailSection>

        {/* Join date */}
        <DetailSection icon={<Calendar className="w-3.5 h-3.5" />} label="Join Date">
          <span className="text-xs text-foreground">
            {user.created_at ? format(new Date(user.created_at), "d MMM yyyy") : "—"}
          </span>
        </DetailSection>

        {/* Roles detail */}
        <DetailSection icon={<Shield className="w-3.5 h-3.5" />} label="Assigned Roles">
          {user.roles.length === 0 ? (
            <span className="text-xs text-muted-foreground italic">No roles assigned</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {user.roles.map(r => (
                <span key={r} className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium capitalize", ROLE_COLORS[r])}>
                  {r.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}
        </DetailSection>
      </div>
    </div>
  );
}

function DetailSection({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-muted-foreground">{icon}</span>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      </div>
      <div className="pl-5">{children}</div>
    </div>
  );
}
