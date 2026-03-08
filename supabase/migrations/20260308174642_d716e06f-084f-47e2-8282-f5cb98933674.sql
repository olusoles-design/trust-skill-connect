
-- Standalone practitioner directory table (no auth FK requirement, allows seed data + admin-added entries)
CREATE TABLE IF NOT EXISTS public.practitioner_listings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID,  -- optional link to auth user if they sign up
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  job_title     TEXT,
  location      TEXT,
  province      TEXT,
  bio           TEXT,
  skills        TEXT[] DEFAULT '{}',
  languages     TEXT[] DEFAULT '{}',
  nqf_level     TEXT,
  availability  TEXT DEFAULT 'flexible',
  phone         TEXT,
  email         TEXT,
  linkedin_url  TEXT,
  avatar_url    TEXT,
  is_verified   BOOLEAN NOT NULL DEFAULT false,
  is_featured   BOOLEAN NOT NULL DEFAULT false,
  years_exp     INTEGER,
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Practitioner roles/accreditations linked to listings
CREATE TABLE IF NOT EXISTS public.practitioner_listing_accreds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      UUID NOT NULL REFERENCES public.practitioner_listings(id) ON DELETE CASCADE,
  role_type       TEXT NOT NULL,
  seta_body       TEXT NOT NULL,
  reg_number      TEXT,
  valid_from      DATE,
  valid_to        DATE,
  status          TEXT NOT NULL DEFAULT 'active',
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.practitioner_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practitioner_listing_accreds ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read active listings
CREATE POLICY "Public view active practitioner listings"
  ON public.practitioner_listings FOR SELECT TO authenticated
  USING (status = 'active');

-- Admins can manage
CREATE POLICY "Admins manage practitioner listings"
  ON public.practitioner_listings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Owner can manage own listing (if linked to auth user)
CREATE POLICY "Owner manages own listing"
  ON public.practitioner_listings FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Accreds: public read
CREATE POLICY "Public view practitioner listing accreds"
  ON public.practitioner_listing_accreds FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins manage practitioner listing accreds"
  ON public.practitioner_listing_accreds FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_practitioner_listings_updated_at
  BEFORE UPDATE ON public.practitioner_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
