
-- ─────────────────────────────────────────────
-- CMS: Design Manager
-- Tables: cms_menus, cms_menu_items, cms_role_menu_permissions,
--         cms_pages, cms_page_blocks
-- ─────────────────────────────────────────────

-- 1. Menus
CREATE TABLE public.cms_menus (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_by  UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage menus"
  ON public.cms_menus FOR ALL
  USING  (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users view active menus"
  ON public.cms_menus FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 2. Menu Items
CREATE TABLE public.cms_menu_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id     UUID NOT NULL REFERENCES public.cms_menus(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES public.cms_menu_items(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  item_type   TEXT NOT NULL DEFAULT 'builtin'  CHECK (item_type IN ('builtin','page','external')),
  target_url  TEXT,
  icon_name   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  open_in_new_tab BOOLEAN NOT NULL DEFAULT false,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage menu items"
  ON public.cms_menu_items FOR ALL
  USING  (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users view active menu items"
  ON public.cms_menu_items FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 3. Role Menu Permissions (per menu or per item)
CREATE TABLE public.cms_role_menu_permissions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id      UUID REFERENCES public.cms_menus(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.cms_menu_items(id) ON DELETE CASCADE,
  role         app_role NOT NULL,
  is_enabled   BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_menu_or_item CHECK (
    (menu_id IS NOT NULL AND menu_item_id IS NULL) OR
    (menu_id IS NULL AND menu_item_id IS NOT NULL)
  )
);

ALTER TABLE public.cms_role_menu_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage role permissions"
  ON public.cms_role_menu_permissions FOR ALL
  USING  (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users view permissions"
  ON public.cms_role_menu_permissions FOR SELECT
  TO authenticated
  USING (true);

-- 4. Pages
CREATE TABLE public.cms_pages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT,
  is_published  BOOLEAN NOT NULL DEFAULT false,
  is_homepage   BOOLEAN NOT NULL DEFAULT false,
  meta_title    TEXT,
  meta_desc     TEXT,
  created_by    UUID NOT NULL,
  updated_by    UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage pages"
  ON public.cms_pages FOR ALL
  USING  (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users view published pages"
  ON public.cms_pages FOR SELECT
  TO authenticated
  USING (is_published = true);

-- 5. Page Blocks
CREATE TABLE public.cms_page_blocks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id      UUID NOT NULL REFERENCES public.cms_pages(id) ON DELETE CASCADE,
  block_type   TEXT NOT NULL DEFAULT 'text' CHECK (block_type IN ('text','content_list','divider','image')),
  title        TEXT,
  content      TEXT,
  config       JSONB NOT NULL DEFAULT '{}',
  sort_order   INTEGER NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_page_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage page blocks"
  ON public.cms_page_blocks FOR ALL
  USING  (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users view active blocks on published pages"
  ON public.cms_page_blocks FOR SELECT
  TO authenticated
  USING (
    is_active = true AND
    EXISTS (SELECT 1 FROM public.cms_pages p WHERE p.id = page_id AND p.is_published = true)
  );

-- 6. Timestamps triggers
CREATE TRIGGER update_cms_menus_updated_at
  BEFORE UPDATE ON public.cms_menus
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cms_menu_items_updated_at
  BEFORE UPDATE ON public.cms_menu_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cms_role_menu_permissions_updated_at
  BEFORE UPDATE ON public.cms_role_menu_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cms_pages_updated_at
  BEFORE UPDATE ON public.cms_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cms_page_blocks_updated_at
  BEFORE UPDATE ON public.cms_page_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Indexes
CREATE INDEX idx_cms_menu_items_menu_id     ON public.cms_menu_items(menu_id);
CREATE INDEX idx_cms_page_blocks_page_id    ON public.cms_page_blocks(page_id);
CREATE INDEX idx_cms_role_perms_menu_id     ON public.cms_role_menu_permissions(menu_id);
CREATE INDEX idx_cms_role_perms_item_id     ON public.cms_role_menu_permissions(menu_item_id);
CREATE INDEX idx_cms_pages_slug             ON public.cms_pages(slug);
CREATE INDEX idx_cms_menus_slug             ON public.cms_menus(slug);
