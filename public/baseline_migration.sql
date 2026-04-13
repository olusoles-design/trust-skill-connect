-- ══════════════════════════════════════════════════════════════════
-- CONSOLIDATED BASELINE MIGRATION
-- Generated: 2026-04-13
-- Merges 21 incremental migrations into one idempotent baseline.
-- This file is a REFERENCE ONLY — the actual schema is applied
-- via the individual migration files in supabase/migrations/.
-- ══════════════════════════════════════════════════════════════════

-- ─── 1. ENUMS ──────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM (
      'learner','sponsor','provider','practitioner','support_provider',
      'admin','seta','government','fundi','employer'
    );
  END IF;
END $$;

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'seta';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'government';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'fundi';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'employer';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
    CREATE TYPE public.subscription_plan AS ENUM ('starter','professional','enterprise');
  END IF;
END $$;

-- ─── 2. FUNCTIONS ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.subscriptions (user_id, plan)
  VALUES (NEW.id, 'starter')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.wallets (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_opportunity_applications()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.opportunities SET applications = applications + 1 WHERE id = NEW.opportunity_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_opportunity_applications()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.opportunities SET applications = GREATEST(0, applications - 1) WHERE id = OLD.opportunity_id;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_review_rating()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_listing_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.provider_listings SET
    rating_avg   = (SELECT COALESCE(AVG(rating), 0) FROM public.provider_reviews WHERE listing_id = COALESCE(NEW.listing_id, OLD.listing_id)),
    review_count = (SELECT COUNT(*) FROM public.provider_reviews WHERE listing_id = COALESCE(NEW.listing_id, OLD.listing_id))
  WHERE id = COALESCE(NEW.listing_id, OLD.listing_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ─── 3. TABLES ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL UNIQUE,
  first_name      TEXT,
  last_name       TEXT,
  username        TEXT UNIQUE,
  phone           TEXT,
  avatar_url      TEXT,
  bio             TEXT,
  skills          TEXT[],
  location        TEXT,
  id_number       TEXT,
  company_name    TEXT,
  job_title       TEXT,
  linkedin_url    TEXT,
  website_url     TEXT,
  nqf_level       TEXT,
  availability    TEXT DEFAULT 'flexible',
  languages       TEXT[] DEFAULT '{}'::text[],
  demographics    JSONB DEFAULT '{}'::jsonb,
  sharing_settings JSONB NOT NULL DEFAULT '{"allow_requests":true,"default_approval":"manual","default_access_days":30,"default_watermark":true}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id      UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role    app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id            UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL UNIQUE,
  plan          subscription_plan NOT NULL DEFAULT 'starter',
  trial_ends_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.wallets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL UNIQUE,
  balance        NUMERIC NOT NULL DEFAULT 0,
  escrow_balance NUMERIC NOT NULL DEFAULT 0,
  currency       TEXT NOT NULL DEFAULT 'ZAR',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.opportunities (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by           UUID NOT NULL,
  title               TEXT NOT NULL,
  description         TEXT,
  organisation        TEXT,
  type                TEXT NOT NULL DEFAULT 'job',
  category            TEXT,
  location            TEXT,
  stipend             TEXT,
  duration            TEXT,
  closing_date        DATE,
  seta                TEXT,
  bbee_points         BOOLEAN DEFAULT false,
  verified            BOOLEAN DEFAULT false,
  featured            BOOLEAN DEFAULT false,
  status              TEXT NOT NULL DEFAULT 'active',
  tags                TEXT[],
  applications        INT NOT NULL DEFAULT 0,
  views               INT NOT NULL DEFAULT 0,
  nqf_level_required  TEXT,
  demographics_target JSONB DEFAULT '{}'::jsonb,
  languages_required  TEXT[] DEFAULT '{}'::text[],
  regulatory_body_id  UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.applications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  applicant_id   UUID NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending',
  cover_note     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (opportunity_id, applicant_id)
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.micro_tasks (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  posted_by   UUID NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  category    TEXT,
  pay         TEXT,
  duration    TEXT,
  location    TEXT NOT NULL DEFAULT 'Remote',
  urgency     TEXT NOT NULL DEFAULT 'Flexible',
  status      TEXT NOT NULL DEFAULT 'available',
  skills      TEXT[],
  employer    TEXT,
  accepted_by UUID,
  escrow_held NUMERIC(10,2),
  max_workers INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.micro_tasks ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.task_submissions (
  id            UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id       UUID NOT NULL REFERENCES public.micro_tasks(id) ON DELETE CASCADE,
  worker_id     UUID NOT NULL,
  status        TEXT NOT NULL DEFAULT 'in_progress',
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at  TIMESTAMPTZ,
  reviewed_at   TIMESTAMPTZ,
  proof_text    TEXT,
  proof_url     TEXT,
  timer_seconds INTEGER NOT NULL DEFAULT 0,
  quality_score SMALLINT,
  reviewer_note TEXT,
  earnings      NUMERIC(10,2),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (task_id, worker_id)
);
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.task_ratings (
  id         UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id    UUID NOT NULL REFERENCES public.micro_tasks(id) ON DELETE CASCADE,
  rater_id   UUID NOT NULL,
  ratee_id   UUID NOT NULL,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  role       TEXT NOT NULL CHECK (role IN ('worker_rates_poster','poster_rates_worker')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (task_id, rater_id, role)
);
ALTER TABLE public.task_ratings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  gateway     TEXT NOT NULL,
  gateway_ref TEXT,
  type        TEXT NOT NULL,
  amount      NUMERIC NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'ZAR',
  status      TEXT NOT NULL DEFAULT 'pending',
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL,
  amount           NUMERIC NOT NULL,
  currency         TEXT NOT NULL DEFAULT 'ZAR',
  method           TEXT NOT NULL,
  bank_name        TEXT,
  account_number   TEXT,
  account_holder   TEXT,
  mobile_number    TEXT,
  status           TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  processed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id           UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id     UUID NOT NULL,
  actor_role   TEXT NOT NULL,
  action       TEXT NOT NULL,
  entity_type  TEXT NOT NULL,
  entity_id    TEXT NOT NULL,
  entity_label TEXT,
  before_data  JSONB,
  after_data   JSONB,
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.match_results (
  id             UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID NOT NULL,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  score          INTEGER NOT NULL DEFAULT 0,
  explanation    TEXT,
  factors        JSONB DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.provider_listings (
  id             UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID NOT NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  category       TEXT NOT NULL,
  pricing_model  TEXT NOT NULL DEFAULT 'project',
  price_from     NUMERIC,
  price_to       NUMERIC,
  currency       TEXT NOT NULL DEFAULT 'ZAR',
  location       TEXT,
  services       TEXT[],
  certifications TEXT[],
  portfolio_urls TEXT[],
  status         TEXT NOT NULL DEFAULT 'active',
  rating_avg     NUMERIC NOT NULL DEFAULT 0,
  review_count   INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.provider_listings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.provider_reviews (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id  UUID NOT NULL REFERENCES public.provider_listings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  rating      INTEGER NOT NULL,
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.provider_reviews ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.rfqs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id     UUID NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  category     TEXT,
  budget_from  NUMERIC,
  budget_to    NUMERIC,
  currency     TEXT NOT NULL DEFAULT 'ZAR',
  deadline     DATE,
  status       TEXT NOT NULL DEFAULT 'open',
  requirements JSONB DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.rfq_responses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id       UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  provider_id  UUID NOT NULL,
  listing_id   UUID REFERENCES public.provider_listings(id),
  quote_amount NUMERIC,
  currency     TEXT NOT NULL DEFAULT 'ZAR',
  proposal     TEXT,
  timeline     TEXT,
  status       TEXT NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rfq_id, provider_id)
);
ALTER TABLE public.rfq_responses ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.document_vault (
  id            UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL,
  doc_type      TEXT NOT NULL,
  label         TEXT NOT NULL,
  file_url      TEXT NOT NULL,
  file_name     TEXT NOT NULL,
  file_size     BIGINT,
  mime_type     TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',
  expires_at    DATE,
  reviewed_by   UUID,
  reviewed_at   TIMESTAMPTZ,
  reviewer_note TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.document_vault ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.regulatory_bodies (
  id                UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  acronym           TEXT NOT NULL UNIQUE,
  full_name         TEXT NOT NULL,
  body_type         TEXT NOT NULL,
  sector            TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  is_levy_funded    BOOLEAN NOT NULL DEFAULT false,
  reporting_formats JSONB NOT NULL DEFAULT '[]'::jsonb,
  doc_rules         JSONB NOT NULL DEFAULT '[]'::jsonb,
  website_url       TEXT,
  notes             TEXT,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.regulatory_bodies ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'opportunities_regulatory_body_id_fkey'
  ) THEN
    ALTER TABLE public.opportunities
      ADD CONSTRAINT opportunities_regulatory_body_id_fkey
      FOREIGN KEY (regulatory_body_id) REFERENCES public.regulatory_bodies(id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.reports (
  id                UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID NOT NULL,
  regulatory_body_id UUID REFERENCES public.regulatory_bodies(id),
  report_type       TEXT NOT NULL,
  financial_year    TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'generated',
  output_url        TEXT,
  data_snapshot     JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at      TIMESTAMPTZ,
  submission_notes  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.funding_opportunities (
  id                   UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sponsor_id           UUID NOT NULL,
  title                TEXT NOT NULL,
  programme_type       TEXT NOT NULL DEFAULT 'learnership',
  description          TEXT,
  sector               TEXT,
  nqf_level            TEXT,
  seats_available      INTEGER NOT NULL DEFAULT 1,
  budget_per_learner   NUMERIC,
  total_budget         NUMERIC,
  currency             TEXT NOT NULL DEFAULT 'ZAR',
  province             TEXT,
  duration             TEXT,
  start_date           DATE,
  application_deadline DATE,
  requirements         JSONB NOT NULL DEFAULT '[]'::jsonb,
  status               TEXT NOT NULL DEFAULT 'open',
  awarded_to           UUID,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.funding_opportunities ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.eoi_submissions (
  id             UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funding_opp_id UUID NOT NULL REFERENCES public.funding_opportunities(id) ON DELETE CASCADE,
  provider_id    UUID NOT NULL,
  message        TEXT,
  accreditations JSONB NOT NULL DEFAULT '[]'::jsonb,
  proposed_start DATE,
  status         TEXT NOT NULL DEFAULT 'pending',
  reviewed_at    TIMESTAMPTZ,
  reviewer_note  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (funding_opp_id, provider_id)
);
ALTER TABLE public.eoi_submissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.practitioner_accreditations (
  id                  UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID NOT NULL,
  seta_body           TEXT NOT NULL,
  role_type           TEXT NOT NULL,
  registration_number TEXT,
  id_number           TEXT,
  valid_from          DATE,
  valid_to            DATE,
  status              TEXT NOT NULL DEFAULT 'active',
  document_url        TEXT,
  raw_extracted       JSONB DEFAULT '{}'::jsonb,
  shareable           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.practitioner_accreditations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.accreditation_qualifications (
  id                UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  accreditation_id  UUID NOT NULL REFERENCES public.practitioner_accreditations(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL,
  saqa_id           TEXT,
  title             TEXT NOT NULL,
  nqf_level         TEXT,
  credits           INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.accreditation_qualifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.academic_credentials (
  id                 UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            UUID NOT NULL,
  qualification_type TEXT NOT NULL,
  institution        TEXT NOT NULL,
  field_of_study     TEXT,
  completion_year    INTEGER,
  status             TEXT NOT NULL DEFAULT 'completed',
  document_url       TEXT,
  shareable          BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.academic_credentials ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.vendor_credentials (
  id                 UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            UUID NOT NULL,
  vendor             TEXT NOT NULL,
  certification_name TEXT NOT NULL,
  credential_id      TEXT,
  issue_date         DATE,
  expiry_date        DATE,
  document_url       TEXT,
  shareable          BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vendor_credentials ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.sponsor_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE,
  company_name    TEXT NOT NULL,
  logo_url        TEXT,
  tagline         TEXT,
  description     TEXT,
  website_url     TEXT,
  sectors         TEXT[] DEFAULT '{}',
  provinces       TEXT[] DEFAULT '{}',
  programme_types TEXT[] DEFAULT '{}',
  annual_budget   TEXT,
  contact_email   TEXT,
  contact_phone   TEXT,
  linkedin_url    TEXT,
  is_public       BOOLEAN NOT NULL DEFAULT true,
  verified        BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sponsor_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.practitioner_listings (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID,
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  job_title   TEXT,
  email       TEXT,
  phone       TEXT,
  linkedin_url TEXT,
  avatar_url  TEXT,
  bio         TEXT,
  skills      TEXT[] DEFAULT '{}'::text[],
  languages   TEXT[] DEFAULT '{}'::text[],
  nqf_level   TEXT,
  location    TEXT,
  province    TEXT,
  years_exp   INTEGER,
  availability TEXT DEFAULT 'flexible',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.practitioner_listings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.practitioner_listing_accreds (
  id         UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.practitioner_listings(id) ON DELETE CASCADE,
  role_type  TEXT NOT NULL,
  seta_body  TEXT NOT NULL,
  reg_number TEXT,
  valid_from DATE,
  valid_to   DATE,
  status     TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.practitioner_listing_accreds ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.sharing_requests (
  id               UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id     UUID NOT NULL,
  practitioner_id  UUID NOT NULL,
  message          TEXT NOT NULL,
  requested_types  JSONB NOT NULL DEFAULT '[]'::jsonb,
  status           TEXT NOT NULL DEFAULT 'pending',
  approved_at      TIMESTAMPTZ,
  access_expiry    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sharing_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.shared_access (
  id            UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id    UUID NOT NULL REFERENCES public.sharing_requests(id) ON DELETE CASCADE,
  access_token  TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  document_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  expiry        TIMESTAMPTZ NOT NULL,
  watermark     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shared_access ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.access_logs (
  id           UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  access_token TEXT NOT NULL,
  viewer_id    UUID,
  action       TEXT NOT NULL DEFAULT 'view',
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT,
  data       JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.company_participants (
  id                     UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id         UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  user_id                UUID NOT NULL,
  company_name           TEXT NOT NULL,
  role                   TEXT NOT NULL,
  cost_share_percentage  NUMERIC DEFAULT 0,
  bbbee_points_allocated NUMERIC DEFAULT 0,
  agreement_document_url TEXT,
  notes                  TEXT,
  status                 TEXT NOT NULL DEFAULT 'active',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.company_participants ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.learner_programmes (
  id                UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID NOT NULL,
  title             TEXT NOT NULL,
  provider          TEXT NOT NULL,
  nqf_level         INTEGER NOT NULL DEFAULT 1,
  progress_pct      INTEGER NOT NULL DEFAULT 0,
  modules_completed INTEGER NOT NULL DEFAULT 0,
  total_modules     INTEGER NOT NULL DEFAULT 1,
  due_date          DATE,
  status            TEXT NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.learner_programmes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.practitioner_contracts (
  id                UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  practitioner_id   UUID NOT NULL,
  client_name       TEXT NOT NULL,
  programme         TEXT NOT NULL,
  practitioner_type TEXT NOT NULL DEFAULT 'facilitator',
  start_date        DATE,
  end_date          DATE,
  total_days        INTEGER NOT NULL DEFAULT 1,
  daily_rate        NUMERIC NOT NULL DEFAULT 0,
  currency          TEXT NOT NULL DEFAULT 'ZAR',
  status            TEXT NOT NULL DEFAULT 'active',
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.practitioner_contracts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.cms_menus (
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

CREATE TABLE IF NOT EXISTS public.cms_menu_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id         UUID NOT NULL REFERENCES public.cms_menus(id) ON DELETE CASCADE,
  parent_id       UUID REFERENCES public.cms_menu_items(id) ON DELETE CASCADE,
  label           TEXT NOT NULL,
  item_type       TEXT NOT NULL DEFAULT 'builtin',
  target_url      TEXT,
  icon_name       TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  open_in_new_tab BOOLEAN NOT NULL DEFAULT false,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cms_menu_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.cms_role_menu_permissions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id      UUID REFERENCES public.cms_menus(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.cms_menu_items(id) ON DELETE CASCADE,
  role         app_role NOT NULL,
  is_enabled   BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cms_role_menu_permissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.cms_pages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  description  TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_homepage  BOOLEAN NOT NULL DEFAULT false,
  meta_title   TEXT,
  meta_desc    TEXT,
  created_by   UUID NOT NULL,
  updated_by   UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.cms_page_blocks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id    UUID NOT NULL REFERENCES public.cms_pages(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL DEFAULT 'text',
  title      TEXT,
  content    TEXT,
  config     JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cms_page_blocks ENABLE ROW LEVEL SECURITY;

-- ─── 4. INDEXES ────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_opportunities_status    ON public.opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_type      ON public.opportunities(type);
CREATE INDEX IF NOT EXISTS idx_opportunities_posted_by ON public.opportunities(posted_by);
CREATE INDEX IF NOT EXISTS idx_rfqs_buyer              ON public.rfqs(buyer_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_status             ON public.rfqs(status);
CREATE INDEX IF NOT EXISTS idx_rfq_responses_rfq       ON public.rfq_responses(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_responses_provider  ON public.rfq_responses(provider_id);
CREATE INDEX IF NOT EXISTS idx_document_vault_user_id  ON public.document_vault(user_id);
CREATE INDEX IF NOT EXISTS idx_document_vault_status   ON public.document_vault(status);
CREATE INDEX IF NOT EXISTS idx_document_vault_expires  ON public.document_vault(expires_at);
CREATE INDEX IF NOT EXISTS idx_reg_bodies_type         ON public.regulatory_bodies(body_type);
CREATE INDEX IF NOT EXISTS idx_reg_bodies_active       ON public.regulatory_bodies(is_active);
CREATE INDEX IF NOT EXISTS idx_reports_user            ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_body            ON public.reports(regulatory_body_id);
CREATE INDEX IF NOT EXISTS idx_cms_menu_items_menu_id  ON public.cms_menu_items(menu_id);
CREATE INDEX IF NOT EXISTS idx_cms_page_blocks_page_id ON public.cms_page_blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_cms_role_perms_menu_id  ON public.cms_role_menu_permissions(menu_id);
CREATE INDEX IF NOT EXISTS idx_cms_role_perms_item_id  ON public.cms_role_menu_permissions(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_cms_pages_slug          ON public.cms_pages(slug);
CREATE INDEX IF NOT EXISTS idx_cms_menus_slug          ON public.cms_menus(slug);

-- ─── 5. RLS POLICIES ──────────────────────────────────────────
-- (See public/schema.sql for the full policy reference)

-- ─── 6. TRIGGERS ───────────────────────────────────────────────
-- (See public/schema.sql for the full trigger reference)

-- ─── 7. STORAGE BUCKETS ────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT (id) DO NOTHING;

-- ─── 8. REALTIME ───────────────────────────────────────────────

-- ALTER PUBLICATION supabase_realtime ADD TABLE public.rfqs;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.task_submissions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.sharing_requests;

-- ─── 9. SEED DATA ──────────────────────────────────────────────

INSERT INTO public.regulatory_bodies
  (acronym, full_name, body_type, sector, is_levy_funded, reporting_formats, doc_rules, website_url, sort_order)
VALUES
  ('SAQA','South African Qualifications Authority','saqa',NULL,false,'["NQF Registration"]','["NQF Cert","ID Copy"]','https://www.saqa.org.za',1),
  ('QCTO','Quality Council for Trades and Occupations','qcto','Trades & Occupations',false,'["OFO Report","Occupational Qualification"]','["Accreditation Letter","OFO Code Sheet"]','https://www.qcto.org.za',2),
  ('CHE','Council on Higher Education','other','Higher Education',false,'["Programme Accreditation Report"]','["HEQF Certificate"]','https://www.che.ac.za',3),
  ('Umalusi','Council for Quality Assurance in General and FET','other','General & FET',false,'["GENFETQA Report"]','["Matric Certificate"]','https://www.umalusi.org.za',4),
  ('AgriSETA','Agriculture Sector Education and Training Authority','seta','Agriculture, Land Reform & Environment',true,'["WSP","ATR","Pivotal","DSD"]','["Tax Clearance","BEE Affidavit","Accreditation Cert"]','https://www.agriseta.co.za',10),
  ('BANKSETA','Banking Sector Education and Training Authority','seta','Banking',true,'["WSP","ATR","Pivotal","DSD"]','["Tax Clearance","BEE Affidavit","Accreditation Cert"]','https://www.bankseta.org.za',11),
  ('CATHSSETA','Culture, Arts, Tourism, Hospitality and Sport SETA','seta','Culture, Arts, Tourism, Hospitality & Sport',true,'["WSP","ATR","Pivotal","DSD"]','["Tax Clearance","BEE Affidavit","Accreditation Cert"]','https://www.cathsseta.org.za',12),
  ('CHIETA','Chemical Industries Education and Training Authority','seta','Chemical Industries',true,'["WSP","ATR","Pivotal","DSD"]','["Tax Clearance","BEE Affidavit","Accreditation Cert"]','https://www.chieta.org.za',13),
  ('CETA','Construction Education and Training Authority','seta','Construction',true,'["WSP","ATR","Pivotal","DSD"]','["Tax Clearance","BEE Affidavit","Accreditation Cert"]','https://www.ceta.org.za',14),
  ('ETDP SETA','Education, Training and Development Practices SETA','seta','Education, Training & Development',true,'["WSP","ATR","Pivotal","DSD"]','["Tax Clearance","BEE Affidavit","Accreditation Cert","Practitioner Reg"]','https://www.etdpseta.org.za',15),
  ('EWSETA','Energy and Water Sector Education and Training Authority','seta','Energy & Water',true,'["WSP","ATR","Pivotal","DSD"]','["Tax Clearance","BEE Affidavit","Accreditation Cert"]','https://www.ewseta.org.za',16),
  ('FASSET','Financial and Accounting Services Sector Education and Training Authority','seta','Finance, Accounting & Management Consulting',true,'["WSP","ATR","Pivotal","DSD"]','["Tax Clearance","BEE Affidavit","Accreditation Cert"]','https://www.fasset.org.za',17),
  ('FIETA','Fibre Processing and Manufacturing SETA','seta','Fibre, Textile, Clothing, Leather & Footwear',true,'["WSP","ATR","Pivotal","DSD"]','["Tax Clearance","BEE Affidavit","Accreditation Cert"]','https://www.fieta.org.za',18),
  ('FOODBEV','Food and Beverages Manufacturing Industry SETA','seta','Food & Beverages',true,'["WSP","ATR","Pivotal","DSD"]','["Tax Clearance","BEE Affidavit","Accreditation Cert"]','https://www.foodbev.co.za',19),
  ('HWSETA','Health and Welfare Sector Education and Training Authority','seta','Health & Social Development',true,'["WSP","ATR","Pivotal","DSD"]','["Tax Clearance","BEE Affidavit","Accreditation Cert"]','https://www.hwseta.org.za',20),
  ('INSETA','Insurance Sector Education and Training Authority','seta','Insurance',true,'["WSP","ATR","Pivotal","DSD"]','["Tax Clearance","BEE Affidavit","Accreditation Cert"]','https://www.inseta.org.za',21),
  ('LGSETA','Local Government Sector Education and Training Authority','seta','Local Government',true,'["WSP","ATR","Pivotal","DSD"]','["Tax Clearance","BEE Affidavit","Accreditation Cert"]','https://www.lgseta.org.za',22),
  ('MERSETA','Manufacturing, Engineering and Related Services SETA','seta','Manufacturing, Engineering & Related Services',true,'["WSP","ATR","Pivotal","DSD"]','["Tax Clearance","BEE Affidavit","Accreditation Cert","Practitioner Reg"]','https://www.merseta.org.za',23),
  ('MICT SETA','Media, Information and Communication Technologies SETA','seta','Media, Information & Communication Technology',true,'["WSP","ATR","Pivotal","DSD"]','["Tax Clearance","BEE Affidavit","Accreditation Cert"]','https://www.mict.org.za',24),
  ('MQA','Mining Qualifications Authority','seta','Mining & Minerals',true,'["WSP","ATR","Pivotal","DSD"]','["Tax Clearance","BEE Affidavit","Accreditation Cert"]','https://www.mqa.org.za',25),
  ('PSETA','Public Service Sector Education and Training Authority','seta','Public Service',true,'["WSP","ATR","Pivotal","DSD"]','["Tax Clearance","BEE Affidavit","Accreditation Cert"]','https://www.pseta.gov.za',26),
  ('SASSETA','Safety and Security Sector Education and Training Authority','seta','Safety & Security',true,'["WSP","ATR","Pivotal","DSD"]','["Tax Clearance","BEE Affidavit","Accreditation Cert"]','https://www.sasseta.org.za',27),
  ('Services SETA','Services Sector Education and Training Authority','seta','Services',true,'["WSP","ATR","Pivotal","DSD"]','["Tax Clearance","BEE Affidavit","Accreditation Cert"]','https://www.serviceseta.org.za',28),
  ('TETA','Transport Education and Training Authority','seta','Transport',true,'["WSP","ATR","Pivotal","DSD"]','["Tax Clearance","BEE Affidavit","Accreditation Cert"]','https://www.teta.org.za',29),
  ('W&RSETA','Wholesale and Retail Sector Education and Training Authority','seta','Wholesale & Retail',true,'["WSP","ATR","Pivotal","DSD"]','["Tax Clearance","BEE Affidavit","Accreditation Cert"]','https://www.wrseta.org.za',30)
ON CONFLICT (acronym) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- END OF CONSOLIDATED BASELINE
-- ═══════════════════════════════════════════════════════════════
