import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, UserCog, ShieldCheck, Mail, MoreHorizontal, RefreshCw, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ALL_ROLES: AppRole[] = [
  "learner","practitioner","employer","provider","sponsor","fundi","support_provider","seta","government","admin"
];

const ROLE_BADGE: Record<AppRole, string> = {
  learner:          "bg-primary/10 text-primary",
  practitioner:     "bg-accent/20 text-accent-foreground",
  employer:         "bg-success/15 text-success",
  provider:         "bg-warning/15 text-warning",
  sponsor:          "bg-primary/10 text-primary",
  fundi:            "bg-accent/20 text-accent-foreground",
  support_provider: "bg-muted text-muted-foreground",
  seta:             "bg-destructive/10 text-destructive",
  government:       "bg-destructive/10 text-destructive",
  admin:            "bg-destructive/15 text-destructive font-semibold",
};

interface UserRow {
  user_id: string;
  email?: string;
  roles: AppRole[];
  created_at?: string;
}

export function ManageUsersWidget() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<AppRole | "all">("all");
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [addRole, setAddRole] = useState<AppRole>("learner");

  // Fetch all user_roles joined with profiles for email
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["manage-users"],
    queryFn: async () => {
      // Get all roles
      const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rolesErr) throw rolesErr;

      // Get profiles for name/email info
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name");

      // Group by user_id
      const map = new Map<string, UserRow>();
      for (const r of roles ?? []) {
        if (!map.has(r.user_id)) {
          const profile = profiles?.find(p => p.user_id === r.user_id);
          map.set(r.user_id, {
            user_id: r.user_id,
            email: profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || r.user_id.slice(0, 8) + "…" : r.user_id.slice(0, 8) + "…",
            roles: [],
          });
        }
        map.get(r.user_id)!.roles.push(r.role as AppRole);
      }
      return Array.from(map.values());
    },
  });

  const addRoleMut = useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").insert({ user_id, role });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage-users"] });
      toast.success("Role added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeRoleMut = useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", user_id)
        .eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage-users"] });
      if (editUser) {
        setEditUser(prev => prev ? { ...prev, roles: prev.roles.filter(r => r !== editUser.roles[0]) } : null);
      }
      toast.success("Role removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = users.filter(u => {
    const matchesSearch = !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.user_id.includes(search);
    const matchesRole = filterRole === "all" || u.roles.includes(filterRole);
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name or ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Select value={filterRole} onValueChange={v => setFilterRole(v as AppRole | "all")}>
          <SelectTrigger className="h-8 text-xs w-40">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ALL_ROLES.map(r => (
              <SelectItem key={r} value={r} className="capitalize">{r.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => refetch()}>
          <RefreshCw className="w-3 h-3" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Users",  value: users.length },
          { label: "Admins",       value: users.filter(u => u.roles.includes("admin")).length },
          { label: "Learners",     value: users.filter(u => u.roles.includes("learner")).length },
          { label: "Providers",    value: users.filter(u => u.roles.includes("provider")).length },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">User</th>
                <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground">Roles</th>
                <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">Loading users…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">No users found.</td></tr>
              ) : filtered.map((u, i) => (
                <tr key={u.user_id} className={`border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/5"}`}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <UserCog className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground truncate max-w-[180px]">{u.email}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{u.user_id.slice(0, 12)}…</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map(r => (
                        <span key={r} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${ROLE_BADGE[r] ?? "bg-muted text-muted-foreground"}`}>
                          {r.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs">
                        <DropdownMenuItem onClick={() => setEditUser(u)}>
                          <ShieldCheck className="w-3.5 h-3.5 mr-2" /> Manage Roles
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-border bg-muted/20 text-[10px] text-muted-foreground">
            Showing {filtered.length} of {users.length} users
          </div>
        )}
      </div>

      {/* Role Management Dialog */}
      <Dialog open={!!editUser} onOpenChange={open => !open && setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Manage Roles
            </DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/40 px-3 py-2">
                <p className="text-xs font-medium text-foreground">{editUser.email}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{editUser.user_id}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Current Roles</p>
                <div className="flex flex-wrap gap-1.5">
                  {editUser.roles.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">No roles assigned</span>
                  ) : editUser.roles.map(r => (
                    <div key={r} className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-medium capitalize ${ROLE_BADGE[r]}`}>
                      {r.replace(/_/g, " ")}
                      <button
                        className="ml-1 hover:text-destructive transition-colors"
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
                    <SelectTrigger className="h-8 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_ROLES.filter(r => !editUser.roles.includes(r)).map(r => (
                        <SelectItem key={r} value={r} className="capitalize text-xs">{r.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5"
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
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setEditUser(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
