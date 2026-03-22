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
import { Plus, Pencil, Trash2, Copy, Home, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { PageBlocksEditor } from "./PageBlocksEditor";

interface CmsPage {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  is_published: boolean;
  is_homepage: boolean;
  meta_title: string | null;
  meta_desc: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const emptyForm = {
  title: "",
  slug: "",
  description: "",
  meta_title: "",
  meta_desc: "",
  is_published: false,
  is_homepage: false,
};

export function PagesManager() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; page?: CmsPage }>({ open: false });
  const [form, setForm] = useState(emptyForm);

  const { data: pages = [], isLoading } = useQuery<CmsPage[]>({
    queryKey: ["cms_pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_pages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const upsert = useMutation({
    mutationFn: async (values: typeof form & { id?: string }) => {
      if (values.id) {
        const { error } = await supabase
          .from("cms_pages")
          .update({
            title: values.title,
            slug: values.slug,
            description: values.description,
            meta_title: values.meta_title,
            meta_desc: values.meta_desc,
            is_published: values.is_published,
            is_homepage: values.is_homepage,
            updated_by: user!.id,
          })
          .eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cms_pages").insert({
          title: values.title,
          slug: values.slug,
          description: values.description,
          meta_title: values.meta_title,
          meta_desc: values.meta_desc,
          is_published: values.is_published,
          is_homepage: values.is_homepage,
          created_by: user!.id,
          updated_by: user!.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms_pages"] });
      setDialog({ open: false });
      toast.success("Page saved.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePublished = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase.from("cms_pages").update({ is_published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cms_pages"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deletePage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cms_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms_pages"] });
      toast.success("Page deleted.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicatePage = useMutation({
    mutationFn: async (page: CmsPage) => {
      const newSlug = page.slug + "-copy-" + Date.now().toString(36);
      const { data: newPage, error } = await supabase
        .from("cms_pages")
        .insert({
          title: page.title + " (Copy)",
          slug: newSlug,
          description: page.description,
          meta_title: page.meta_title,
          meta_desc: page.meta_desc,
          is_published: false,
          is_homepage: false,
          created_by: user!.id,
          updated_by: user!.id,
        })
        .select()
        .single();
      if (error) throw error;

      // Copy blocks
      const { data: blocks } = await supabase
        .from("cms_page_blocks")
        .select("*")
        .eq("page_id", page.id);

      if (blocks && blocks.length > 0) {
        const { error: blocksError } = await supabase.from("cms_page_blocks").insert(
          blocks.map(b => ({
            page_id: newPage.id,
            block_type: b.block_type,
            title: b.title,
            content: b.content,
            config: b.config,
            sort_order: b.sort_order,
            is_active: b.is_active,
          }))
        );
        if (blocksError) throw blocksError;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cms_pages"] });
      toast.success("Page duplicated.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openCreate() {
    setForm(emptyForm);
    setDialog({ open: true });
  }
  function openEdit(page: CmsPage) {
    setForm({
      title: page.title,
      slug: page.slug,
      description: page.description ?? "",
      meta_title: page.meta_title ?? "",
      meta_desc: page.meta_desc ?? "",
      is_published: page.is_published,
      is_homepage: page.is_homepage,
    });
    setDialog({ open: true, page });
  }
  function handleTitleChange(title: string) {
    setForm(f => ({ ...f, title, slug: dialog.page ? f.slug : slugify(title) }));
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{pages.length} page{pages.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> New Page
        </Button>
      </div>

      {isLoading && <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">Loading…</div>}

      {!isLoading && pages.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          <Plus className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No pages yet. Create your first page.</p>
        </div>
      )}

      <div className="space-y-3">
        {pages.map(page => (
          <Card key={page.id} className="border border-border">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-sm font-semibold">{page.title}</CardTitle>
                    {page.is_homepage && (
                      <Badge className="text-xs gap-1"><Home className="w-3 h-3" />Homepage</Badge>
                    )}
                    <Badge variant="outline" className="text-xs font-mono">/{page.slug}</Badge>
                    <Badge variant={page.is_published ? "default" : "secondary"} className="text-xs">
                      {page.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  {page.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{page.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="icon" variant="ghost" className="h-8 w-8"
                    title={page.is_published ? "Unpublish" : "Publish"}
                    onClick={() => togglePublished.mutate({ id: page.id, is_published: !page.is_published })}
                  >
                    {page.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="icon" variant="ghost" className="h-8 w-8"
                    title="Edit blocks"
                    onClick={() => setEditing(editing === page.id ? null : page.id)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon" variant="ghost" className="h-8 w-8"
                    title="Edit settings"
                    onClick={() => openEdit(page)}
                  >
                    <Pencil className="w-3.5 h-3.5 opacity-60" />
                  </Button>
                  <Button
                    size="icon" variant="ghost" className="h-8 w-8"
                    title="Duplicate"
                    onClick={() => duplicatePage.mutate(page)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon" variant="ghost"
                    className="h-8 w-8 hover:text-destructive"
                    onClick={() => deletePage.mutate(page.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {editing === page.id && (
              <CardContent className="border-t border-border pt-3 px-4 pb-4">
                <PageBlocksEditor pageId={page.id} />
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialog.open} onOpenChange={v => setDialog({ open: v })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog.page ? "Edit Page Settings" : "New Page"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input placeholder="About Us" value={form.title} onChange={e => handleTitleChange(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input
                  placeholder="about-us"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Short description of this page"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Meta Title (SEO)</Label>
                <Input value={form.meta_title} onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Meta Description</Label>
                <Input value={form.meta_desc} onChange={e => setForm(f => ({ ...f, meta_desc: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="published"
                  checked={form.is_published}
                  onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))}
                />
                <Label htmlFor="published">Published</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="homepage"
                  checked={form.is_homepage}
                  onCheckedChange={v => setForm(f => ({ ...f, is_homepage: v }))}
                />
                <Label htmlFor="homepage">Set as Homepage</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false })}>Cancel</Button>
            <Button
              onClick={() => upsert.mutate({ ...form, id: dialog.page?.id })}
              disabled={!form.title || !form.slug || upsert.isPending}
            >
              {upsert.isPending ? "Saving…" : "Save Page"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
