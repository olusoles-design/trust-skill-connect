
-- Sponsor profiles table for the directory
CREATE TABLE public.sponsor_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL UNIQUE,
  company_name    text NOT NULL,
  logo_url        text,
  tagline         text,
  description     text,
  website_url     text,
  sectors         text[]  DEFAULT '{}',
  provinces       text[]  DEFAULT '{}',
  programme_types text[]  DEFAULT '{}',
  annual_budget   text,
  contact_email   text,
  contact_phone   text,
  linkedin_url    text,
  is_public       boolean NOT NULL DEFAULT true,
  verified        boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Timestamps trigger
CREATE TRIGGER update_sponsor_profiles_updated_at
  BEFORE UPDATE ON public.sponsor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.sponsor_profiles ENABLE ROW LEVEL SECURITY;

-- Public can view published (is_public = true) profiles
CREATE POLICY "Public view published sponsor profiles"
  ON public.sponsor_profiles FOR SELECT
  USING (is_public = true);

-- Sponsor can always view their own profile
CREATE POLICY "Sponsor views own profile"
  ON public.sponsor_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Sponsor inserts own profile
CREATE POLICY "Sponsor inserts own profile"
  ON public.sponsor_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Sponsor updates own profile
CREATE POLICY "Sponsor updates own profile"
  ON public.sponsor_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Sponsor deletes own profile
CREATE POLICY "Sponsor deletes own profile"
  ON public.sponsor_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Admins manage all
CREATE POLICY "Admins manage all sponsor profiles"
  ON public.sponsor_profiles FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
