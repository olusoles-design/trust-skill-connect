import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, GripVertical, Type, LayoutGrid, Minus, Image } from "lucide-react";
import { toast } from "sonner";

interface PageBlock {
  id: string;
  page_id: string;
  block_type: string;
  title: string | null;
  content: string | null;
  config: Record<string, unknown>;
  sort_order: number;
  is_active: boolean;
}

interface ContentListConfig {
  display_mode: "grid" | "list";
  columns: number;
  source: "manual" | "dynamic";
  category?: string;
  tags?: string[];
  featured_only?: boolean;
  item_limit: number;
  sort_by: "title" | "date" | "custom";
  show_thumbnail: boolean;
  show_description: boolean;
  show_author: boolean;
  item_ids?: string[];
}

const defaultContentListConfig: ContentListConfig = {
  display_mode: "grid",
  columns: 3,
  source: "dynamic",
  item_limit: 6,
  sort_by: "date",
  show_thumbnail: true,
  show_description: true,
  show_author: false,
};

const BLOCK_TYPE_META = {
  text: { label: "Text / HTML", icon: Type, color: "bg-primary/10 text-primary" },
  content_list: { label: "Content List", icon: LayoutGrid, color: "bg-accent/10 text-accent-foreground" },
  divider: { label: "Divider", icon: Minus, color: "bg-muted text-muted-foreground" },
  image: { label: "Image", icon: Image, color: "bg-success/10 text-success" },
};

function emptyForm(type: string) {
  return {
    block_type: type,
    title: "",
    content: "",
    is_active: true,
    config: type === "content_list" ? defaultContentListConfig : {},
  };
}

export function PageBlocksEditor({ pageId }: { pageId: string }) {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<{ open: boolean; block?: PageBlock; type?: string }>({ open: false });
  const [form, setForm] = useState<ReturnType<typeof emptyForm>>(emptyForm("text"));

  const { data: blocks = [], isLoading } = useQuery<PageBlock[]>({
    queryKey: ["cms_page_blocks", pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_page_blocks")
        .select("*")
        .eq("page_id", pageId)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map(b => ({ ...b, config: (b.config as Record<string, unknown>) ?? {} }));
    },
  });

  const upsert = useMutation({
    mutationFn: async (values: typeof form & { id?: string }) => {
      const payload = {
        page_id: pageId,
        block_type: values.block_type,
        title: values.title || null,
        content: values.content || null,
        config: values.config,
        is_active: values.is_active,
      };
      if (values.id) {
        const { error } = await supabase.from("cms_page_blocks").update(payload).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cms_page_blocks")
          .insert({ ...payload, sort_order: blocks.length });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms_page_blocks", pageId] });
      setDialog({ open: false });
      toast.success("Block saved.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteBlock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cms_page_blocks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms_page_blocks", pageId] });
      toast.success("Block removed.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const moveBlock = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      const idx = blocks.findIndex(b => b.id === id);
      if (direction === "up" && idx === 0) return;
      if (direction === "down" && idx === blocks.length - 1) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      const a = blocks[idx];
      const b = blocks[swapIdx];
      await Promise.all([
        supabase.from("cms_page_blocks").update({ sort_order: b.sort_order }).eq("id", a.id),
        supabase.from("cms_page_blocks").update({ sort_order: a.sort_order }).eq("id", b.id),
      ]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cms_page_blocks", pageId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  function openAdd(type: string) {
    setForm(emptyForm(type));
    setDialog({ open: true, type });
  }
  function openEdit(block: PageBlock) {
    setForm({
      block_type: block.block_type,
      title: block.title ?? "",
      content: block.content ?? "",
      is_active: block.is_active,
      config: block.config,
    });
    setDialog({ open: true, block });
  }

  const cfg = form.config as ContentListConfig;
  function setCfg(partial: Partial<ContentListConfig>) {
    setForm(f => ({ ...f, config: { ...f.config, ...partial } }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Content Blocks ({blocks.length})
        </span>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(BLOCK_TYPE_META).map(([type, meta]) => (
            <Button
              key={type} size="sm" variant="outline"
              className="gap-1.5 h-7 text-xs"
              onClick={() => openAdd(type)}
            >
              <Plus className="w-3 h-3" />
              <meta.icon className="w-3 h-3" />
              {meta.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading && <div className="text-xs text-muted-foreground animate-pulse py-2">Loading blocks…</div>}

      {!isLoading && blocks.length === 0 && (
        <p className="text-xs text-muted-foreground py-2">
          No blocks yet — use the buttons above to add content blocks.
        </p>
      )}

      <div className="space-y-2">
        {blocks.map((block, idx) => {
          const meta = BLOCK_TYPE_META[block.block_type as keyof typeof BLOCK_TYPE_META];
          const Icon = meta?.icon ?? Type;
          return (
            <div
              key={block.id}
              className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 p-3"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
              <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${meta?.color ?? ""}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{block.title || meta?.label || block.block_type}</span>
                  <Badge variant="outline" className="text-xs">{meta?.label ?? block.block_type}</Badge>
                  {!block.is_active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                </div>
                {block.content && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                    {block.content.substring(0, 80)}…
                  </p>
                )}
                {block.block_type === "content_list" && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(block.config as unknown as ContentListConfig).display_mode} · {(block.config as unknown as ContentListConfig).columns ?? 3} cols · limit {(block.config as unknown as ContentListConfig).item_limit}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  size="icon" variant="ghost" className="h-7 w-7"
                  disabled={idx === 0}
                  onClick={() => moveBlock.mutate({ id: block.id, direction: "up" })}
                >▲</Button>
                <Button
                  size="icon" variant="ghost" className="h-7 w-7"
                  disabled={idx === blocks.length - 1}
                  onClick={() => moveBlock.mutate({ id: block.id, direction: "down" })}
                >▼</Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(block)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon" variant="ghost" className="h-7 w-7 hover:text-destructive"
                  onClick={() => deleteBlock.mutate(block.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Block Editor Dialog */}
      <Dialog open={dialog.open} onOpenChange={v => setDialog({ open: v })}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialog.block ? "Edit Block" : `Add ${BLOCK_TYPE_META[form.block_type as keyof typeof BLOCK_TYPE_META]?.label ?? "Block"}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Common fields */}
            <div className="space-y-1.5">
              <Label>Block Title (optional)</Label>
              <Input
                placeholder="Section heading shown to users"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>

            {/* Text block */}
            {form.block_type === "text" && (
              <div className="space-y-1.5">
                <Label>Content (HTML supported)</Label>
                <Textarea
                  placeholder="<p>Enter your content here…</p>"
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            )}

            {/* Image block */}
            {form.block_type === "image" && (
              <div className="space-y-1.5">
                <Label>Image URL</Label>
                <Input
                  placeholder="https://…"
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                />
              </div>
            )}

            {/* Content List block */}
            {form.block_type === "content_list" && (
              <Tabs defaultValue="display">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="display">Display</TabsTrigger>
                  <TabsTrigger value="source">Source</TabsTrigger>
                  <TabsTrigger value="items">Items</TabsTrigger>
                </TabsList>

                <TabsContent value="display" className="space-y-3 mt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Display Mode</Label>
                      <Select value={cfg.display_mode} onValueChange={v => setCfg({ display_mode: v as "grid" | "list" })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grid">Grid</SelectItem>
                          <SelectItem value="list">List</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {cfg.display_mode === "grid" && (
                      <div className="space-y-1.5">
                        <Label>Columns</Label>
                        <Select value={String(cfg.columns)} onValueChange={v => setCfg({ columns: Number(v) })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">2 columns</SelectItem>
                            <SelectItem value="3">3 columns</SelectItem>
                            <SelectItem value="4">4 columns</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Item Limit</Label>
                    <Input
                      type="number" min={1} max={50}
                      value={cfg.item_limit}
                      onChange={e => setCfg({ item_limit: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sort By</Label>
                    <Select value={cfg.sort_by} onValueChange={v => setCfg({ sort_by: v as ContentListConfig["sort_by"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Most Recent</SelectItem>
                        <SelectItem value="title">Title (A–Z)</SelectItem>
                        <SelectItem value="custom">Custom Order</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Show Fields</Label>
                    {[
                      { key: "show_thumbnail" as const, label: "Thumbnail" },
                      { key: "show_description" as const, label: "Description" },
                      { key: "show_author" as const, label: "Author / Posted By" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-2">
                        <Switch checked={!!cfg[key]} onCheckedChange={v => setCfg({ [key]: v })} />
                        <span className="text-sm">{label}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="source" className="space-y-3 mt-3">
                  <div className="space-y-1.5">
                    <Label>Source</Label>
                    <Select value={cfg.source} onValueChange={v => setCfg({ source: v as "manual" | "dynamic" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dynamic">Dynamic (by criteria)</SelectItem>
                        <SelectItem value="manual">Manual selection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {cfg.source === "dynamic" && (
                    <>
                      <div className="space-y-1.5">
                        <Label>Category filter (optional)</Label>
                        <Input
                          placeholder="e.g. learnership, bursary"
                          value={cfg.category ?? ""}
                          onChange={e => setCfg({ category: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!!cfg.featured_only}
                          onCheckedChange={v => setCfg({ featured_only: v })}
                        />
                        <span className="text-sm">Featured items only</span>
                      </div>
                    </>
                  )}
                  {cfg.source === "manual" && (
                    <div className="space-y-1.5">
                      <Label>Item IDs (comma-separated UUIDs)</Label>
                      <Textarea
                        placeholder="uuid1, uuid2, …"
                        value={(cfg.item_ids ?? []).join(", ")}
                        onChange={e => setCfg({ item_ids: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                        rows={3}
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="items" className="mt-3">
                  <div className="rounded-md border border-border bg-muted/20 p-3 text-sm text-muted-foreground text-center">
                    Live preview of matched items will appear on the rendered page.
                    <br />Configure source criteria in the Source tab.
                  </div>
                </TabsContent>
              </Tabs>
            )}

            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))}
                id="block-active"
              />
              <Label htmlFor="block-active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false })}>Cancel</Button>
            <Button
              onClick={() => upsert.mutate({ ...form, id: dialog.block?.id })}
              disabled={upsert.isPending}
            >
              {upsert.isPending ? "Saving…" : "Save Block"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
