import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Users } from "lucide-react";
import { toast } from "sonner";
import { MenuItemsEditor } from "./MenuItemsEditor";
import { RolePermissionsEditor } from "./RolePermissionsEditor";

interface CmsMenu {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function MenusManager() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rolesOpen, setRolesOpen] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; menu?: CmsMenu }>({ open: false });
  const [form, setForm] = useState({ name: "", slug: "", description: "" });

  const { data: menus = [], isLoading } = useQuery<CmsMenu[]>({
    queryKey: ["cms_menus"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_menus")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const upsert = useMutation({
    mutationFn: async (values: { name: string; slug: string; description: string; id?: string }) => {
      if (values.id) {
        const { error } = await supabase
          .from("cms_menus")
          .update({ name: values.name, slug: values.slug, description: values.description })
          .eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cms_menus")
          .insert({ name: values.name, slug: values.slug, description: values.description, created_by: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms_menus"] });
      setDialog({ open: false });
      toast.success("Menu saved.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("cms_menus").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cms_menus"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMenu = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cms_menus").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms_menus"] });
      toast.success("Menu deleted.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openCreate() {
    setForm({ name: "", slug: "", description: "" });
    setDialog({ open: true });
  }
  function openEdit(menu: CmsMenu) {
    setForm({ name: menu.name, slug: menu.slug, description: menu.description ?? "" });
    setDialog({ open: true, menu });
  }
  function handleNameChange(name: string) {
    setForm(f => ({ ...f, name, slug: dialog.menu ? f.slug : slugify(name) }));
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{menus.length} menu{menus.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> New Menu
        </Button>
      </div>

      {isLoading && (
        <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">Loading…</div>
      )}

      {!isLoading && menus.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          <Menu className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No menus yet. Create your first menu.</p>
        </div>
      )}

      <div className="space-y-3">
        {menus.map(menu => (
          <Card key={menu.id} className="border border-border">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setExpanded(expanded === menu.id ? null : menu.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {expanded === menu.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-sm font-semibold">{menu.name}</CardTitle>
                    <Badge variant="outline" className="text-xs font-mono">{menu.slug}</Badge>
                    <Badge variant={menu.is_active ? "default" : "secondary"} className="text-xs">
                      {menu.is_active ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                  {menu.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{menu.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Switch
                    checked={menu.is_active}
                    onCheckedChange={v => toggleActive.mutate({ id: menu.id, is_active: v })}
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setRolesOpen(menu.id)}>
                    <Users className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(menu)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon" variant="ghost"
                    className="h-8 w-8 hover:text-destructive"
                    onClick={() => deleteMenu.mutate(menu.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {expanded === menu.id && (
              <CardContent className="pt-0 px-4 pb-4 border-t border-border">
                <MenuItemsEditor menuId={menu.id} />
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Role Permissions Dialog */}
      {rolesOpen && (
        <RolePermissionsEditor
          menuId={rolesOpen}
          menuName={menus.find(m => m.id === rolesOpen)?.name ?? ""}
          onClose={() => setRolesOpen(null)}
        />
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialog.open} onOpenChange={v => setDialog({ open: v })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog.menu ? "Edit Menu" : "New Menu"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                placeholder="Main Navigation"
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input
                placeholder="main-navigation"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Describe this menu's purpose"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false })}>Cancel</Button>
            <Button
              onClick={() => upsert.mutate({ ...form, id: dialog.menu?.id })}
              disabled={!form.name || !form.slug || upsert.isPending}
            >
              {upsert.isPending ? "Saving…" : "Save Menu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
