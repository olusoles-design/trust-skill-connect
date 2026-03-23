import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, GripVertical, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface MenuItem {
  id: string;
  menu_id: string;
  parent_id: string | null;
  label: string;
  item_type: string;
  target_url: string | null;
  icon_name: string | null;
  is_active: boolean;
  open_in_new_tab: boolean;
  sort_order: number;
}

const BUILTIN_ROUTES = [
  // Common
  { group: "General",    label: "Dashboard Home",         url: "/dashboard" },
  { group: "General",    label: "Payments & Wallet",      url: "/dashboard/payments" },
  { group: "General",    label: "Settings",               url: "/dashboard/settings" },
  // Talent
  { group: "Talent",     label: "Browse Opportunities",   url: "/dashboard/opportunities" },
  { group: "Talent",     label: "My Applications",        url: "/dashboard/applications" },
  { group: "Talent",     label: "Profile & CV",           url: "/dashboard/profile" },
  { group: "Talent",     label: "Document Vault",         url: "/dashboard/vault" },
  { group: "Talent",     label: "Availability & Contracts",url: "/dashboard/availability" },
  { group: "Talent",     label: "Smart Contracting",      url: "/dashboard/contracting" },
  { group: "Talent",     label: "Practitioner Accreditations", url: "/dashboard/accreditations" },
  { group: "Talent",     label: "Practitioner Directory", url: "/dashboard/practitioners" },
  { group: "Talent",     label: "Practitioner Portal",    url: "/dashboard/practitioner-portal" },
  { group: "Talent",     label: "Gigs & Micro-tasks",     url: "/dashboard/gigs" },
  { group: "Talent",     label: "My Earnings & Tasks",    url: "/dashboard/my-tasks" },
  // Business
  { group: "Business",   label: "Post Opportunities",     url: "/dashboard/post" },
  { group: "Business",   label: "Manage Learners",        url: "/dashboard/learners" },
  { group: "Business",   label: "Learner Pipeline",       url: "/dashboard/pipeline" },
  { group: "Business",   label: "B-BBEE Simulator",       url: "/dashboard/bbee" },
  { group: "Business",   label: "Tax Calculator",         url: "/dashboard/tax" },
  { group: "Business",   label: "WSP/ATR Reports",        url: "/dashboard/wsp" },
  { group: "Business",   label: "Tender Feed",            url: "/dashboard/tender-feed" },
  { group: "Business",   label: "Learner Recruitment",    url: "/dashboard/recruitment" },
  { group: "Business",   label: "Outcome Tracking",       url: "/dashboard/outcomes" },
  { group: "Business",   label: "Procurement Hub",        url: "/dashboard/procurement" },
  { group: "Business",   label: "Procurement Alerts",     url: "/dashboard/alerts" },
  { group: "Business",   label: "RFQ Board",              url: "/dashboard/rfq" },
  { group: "Business",   label: "Facility Booking",       url: "/dashboard/booking" },
  { group: "Business",   label: "Marketplace Listing",    url: "/dashboard/marketplace" },
  { group: "Business",   label: "Marketplace Discovery",  url: "/dashboard/discovery" },
  { group: "Business",   label: "Tender Matching",        url: "/dashboard/tenders" },
  { group: "Business",   label: "Workflow Engine",        url: "/dashboard/workflow" },
  // Funding
  { group: "Funding",    label: "Fund Learners",          url: "/dashboard/funding" },
  // Oversight
  { group: "Oversight",  label: "Verify Documents",       url: "/dashboard/verify" },
  { group: "Oversight",  label: "Reports & Analytics",    url: "/dashboard/reports" },
  { group: "Oversight",  label: "Trust Ledger",           url: "/dashboard/ledger" },
  { group: "Oversight",  label: "Platform Admin",         url: "/dashboard/admin" },
  { group: "Oversight",  label: "Manage Users",           url: "/dashboard/manage-users" },
  { group: "Oversight",  label: "Portal Switcher",        url: "/dashboard/portals" },
  { group: "Oversight",  label: "Design Manager",         url: "/dashboard/design-manager" },
];

const ROUTE_GROUPS = [...new Set(BUILTIN_ROUTES.map(r => r.group))];

const emptyForm = {
  label: "",
  item_type: "builtin" as string,
  target_url: "",
  icon_name: "",
  open_in_new_tab: false,
  is_active: true,
};

export function MenuItemsEditor({ menuId }: { menuId: string }) {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<{ open: boolean; item?: MenuItem }>({ open: false });
  const [form, setForm] = useState(emptyForm);

  const { data: items = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["cms_menu_items", menuId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_menu_items")
        .select("*")
        .eq("menu_id", menuId)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const upsert = useMutation({
    mutationFn: async (values: typeof form & { id?: string }) => {
      const payload = {
        menu_id: menuId,
        label: values.label,
        item_type: values.item_type,
        target_url: values.target_url || null,
        icon_name: values.icon_name || null,
        open_in_new_tab: values.open_in_new_tab,
        is_active: values.is_active,
      };
      if (values.id) {
        const { error } = await supabase.from("cms_menu_items").update(payload).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cms_menu_items")
          .insert({ ...payload, sort_order: items.length });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms_menu_items", menuId] });
      setDialog({ open: false });
      toast.success("Item saved.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cms_menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms_menu_items", menuId] });
      toast.success("Item removed.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("cms_menu_items").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cms_menu_items", menuId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  function openCreate() {
    setForm(emptyForm);
    setDialog({ open: true });
  }
  function openEdit(item: MenuItem) {
    setForm({
      label: item.label,
      item_type: item.item_type,
      target_url: item.target_url ?? "",
      icon_name: item.icon_name ?? "",
      open_in_new_tab: item.open_in_new_tab,
      is_active: item.is_active,
    });
    setDialog({ open: true, item });
  }

  return (
    <div className="space-y-3 mt-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Menu Items ({items.length})
        </span>
        <Button size="sm" variant="outline" onClick={openCreate} className="gap-1.5 h-7 text-xs">
          <Plus className="w-3 h-3" /> Add Item
        </Button>
      </div>

      {isLoading && <div className="text-xs text-muted-foreground animate-pulse py-2">Loading items…</div>}

      {!isLoading && items.length === 0 && (
        <p className="text-xs text-muted-foreground py-2">No items yet — add your first menu item.</p>
      )}

      <div className="space-y-1.5">
        {items.map(item => (
          <div
            key={item.id}
            className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2"
          >
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{item.label}</span>
                <Badge variant="outline" className="text-xs capitalize">{item.item_type}</Badge>
                {item.target_url && (
                  <span className="text-xs text-muted-foreground truncate max-w-[180px]">{item.target_url}</span>
                )}
                {item.open_in_new_tab && <ExternalLink className="w-3 h-3 text-muted-foreground" />}
              </div>
            </div>
            <Switch
              checked={item.is_active}
              onCheckedChange={v => toggleActive.mutate({ id: item.id, is_active: v })}
            />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(item)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon" variant="ghost"
              className="h-7 w-7 hover:text-destructive"
              onClick={() => deleteItem.mutate(item.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add / Edit Item Dialog */}
      <Dialog open={dialog.open} onOpenChange={v => setDialog({ open: v })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog.item ? "Edit Menu Item" : "New Menu Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Label</Label>
              <Input
                placeholder="e.g. Home"
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.item_type} onValueChange={v => setForm(f => ({ ...f, item_type: v, target_url: "" }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="builtin">Built-in Page</SelectItem>
                  <SelectItem value="page">Custom Page</SelectItem>
                  <SelectItem value="external">External URL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.item_type === "builtin" && (
              <div className="space-y-1.5">
                <Label>Target Page</Label>
                <Select value={form.target_url} onValueChange={v => setForm(f => ({ ...f, target_url: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a page" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUILTIN_ROUTES.map(r => (
                      <SelectItem key={r.url} value={r.url}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(form.item_type === "page" || form.item_type === "external") && (
              <div className="space-y-1.5">
                <Label>{form.item_type === "external" ? "URL" : "Page Slug"}</Label>
                <Input
                  placeholder={form.item_type === "external" ? "https://example.com" : "/dashboard/my-page"}
                  value={form.target_url}
                  onChange={e => setForm(f => ({ ...f, target_url: e.target.value }))}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Icon Name (optional, Lucide)</Label>
              <Input
                placeholder="e.g. home, users, settings"
                value={form.icon_name}
                onChange={e => setForm(f => ({ ...f, icon_name: e.target.value }))}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.open_in_new_tab}
                onCheckedChange={v => setForm(f => ({ ...f, open_in_new_tab: v }))}
                id="new-tab"
              />
              <Label htmlFor="new-tab">Open in new tab</Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_active}
                onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))}
                id="is-active"
              />
              <Label htmlFor="is-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false })}>Cancel</Button>
            <Button
              onClick={() => upsert.mutate({ ...form, id: dialog.item?.id })}
              disabled={!form.label || upsert.isPending}
            >
              {upsert.isPending ? "Saving…" : "Save Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
