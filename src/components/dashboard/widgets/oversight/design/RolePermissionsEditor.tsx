import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const ALL_ROLES = [
  "learner", "practitioner", "employer", "provider", "sponsor",
  "fundi", "support_provider", "seta", "government", "admin",
] as const;

type AppRole = typeof ALL_ROLES[number];

interface RolePerm {
  id: string;
  menu_id: string | null;
  menu_item_id: string | null;
  role: string;
  is_enabled: boolean;
}

interface Props {
  menuId: string;
  menuName: string;
  onClose: () => void;
}

export function RolePermissionsEditor({ menuId, menuName, onClose }: Props) {
  const qc = useQueryClient();

  const { data: perms = [] } = useQuery<RolePerm[]>({
    queryKey: ["cms_role_perms", menuId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_role_menu_permissions")
        .select("*")
        .eq("menu_id", menuId)
        .is("menu_item_id", null);
      if (error) throw error;
      return data ?? [];
    },
  });

  const upsertPerm = useMutation({
    mutationFn: async ({ role, is_enabled }: { role: AppRole; is_enabled: boolean }) => {
      const existing = perms.find(p => p.role === role);
      if (existing) {
        const { error } = await supabase
          .from("cms_role_menu_permissions")
          .update({ is_enabled })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cms_role_menu_permissions")
          .insert({ menu_id: menuId, menu_item_id: null, role, is_enabled });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cms_role_perms", menuId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  function isEnabled(role: AppRole) {
    const perm = perms.find(p => p.role === role);
    // Default: enabled (shown) for all roles unless explicitly disabled
    return perm ? perm.is_enabled : true;
  }

  const roleLabels: Record<AppRole, string> = {
    learner: "Learner",
    practitioner: "Practitioner",
    employer: "Employer",
    provider: "Training Provider",
    sponsor: "Sponsor",
    fundi: "Fundi",
    support_provider: "Support Provider",
    seta: "SETA Official",
    government: "Government",
    admin: "Admin",
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Role Visibility — {menuName}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-1">
          Toggle each role to show or hide this menu for users in that role.
        </p>

        <div className="space-y-2 py-2">
          {ALL_ROLES.map(role => (
            <div key={role} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs capitalize">{roleLabels[role]}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{isEnabled(role) ? "Visible" : "Hidden"}</span>
                <Switch
                  checked={isEnabled(role)}
                  onCheckedChange={v => upsertPerm.mutate({ role, is_enabled: v })}
                />
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
