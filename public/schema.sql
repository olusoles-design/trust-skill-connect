-- ============================================================
--  FULL REFERENCE SCHEMA SQL
--  Generated: 2026-03-17
--  Project: SkillsBridge / Lovable Cloud (Supabase)
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE public.app_role AS ENUM (
  'learner',
  'sponsor',
  'provider',
  'practitioner',
  'support_provider',
  'admin',
  'seta',
  'government',
  'fundi',
  'employer'
);

CREATE TYPE public.subscription_plan AS ENUM (
  'starter',
  'professional',
  'enterprise'
);

-- ============================================================
-- TABLES
-- ============================================================

-- profiles
CREATE TABLE public.profiles (
  id                uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid        NOT NULL,
  first_name        text,
  last_name         text,
  username          text,
  avatar_url        text,
  bio               text,
  phone             text,
  location          text,
  job_title         text,
  company_name      text,
  id_number         text,
  nqf_level         text,
  skills            text[],
  languages         text[]      DEFAULT '{}'::text[],
  availability      text        DEFAULT 'flexible',
  linkedin_url      text,
  website_url       text,
  demographics      jsonb       DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- user_roles
CREATE TABLE public.user_roles (
  id      uuid      NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid      NOT NULL,
  role    app_role  NOT NULL
);

-- subscriptions
CREATE TABLE public.subscriptions (
  id            uuid              NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid              NOT NULL,
  plan          subscription_plan NOT NULL DEFAULT 'starter',
  is_active     boolean           NOT NULL DEFAULT true,
  trial_ends_at timestamptz                DEFAULT (now() + '30 days'::interval),
  created_at    timestamptz       NOT NULL DEFAULT now(),
  updated_at    timestamptz       NOT NULL DEFAULT now()
);

-- wallets
CREATE TABLE public.wallets (
  id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid        NOT NULL,
  balance         numeric     NOT NULL DEFAULT 0,
  escrow_balance  numeric     NOT NULL DEFAULT 0,
  currency        text        NOT NULL DEFAULT 'ZAR',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- regulatory_bodies
CREATE TABLE public.regulatory_bodies (
  id                 uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  acronym            text        NOT NULL,
  full_name          text        NOT NULL,
  body_type          text        NOT NULL,
  sector             text,
  is_active          boolean     NOT NULL DEFAULT true,
  is_levy_funded     boolean     NOT NULL DEFAULT false,
  sort_order         integer     NOT NULL DEFAULT 0,
  doc_rules          jsonb       NOT NULL DEFAULT '[]'::jsonb,
  reporting_formats  jsonb       NOT NULL DEFAULT '[]'::jsonb,
  website_url        text,
  notes              text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- opportunities
CREATE TABLE public.opportunities (
  id                   uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  posted_by            uuid        NOT NULL,
  title                text        NOT NULL,
  description          text,
  organisation         text,
  type                 text        NOT NULL DEFAULT 'job',
  category             text,
  location             text,
  stipend              text,
  duration             text,
  seta                 text,
  nqf_level_required   text,
  status               text        NOT NULL DEFAULT 'active',
  bbee_points          boolean              DEFAULT false,
  verified             boolean              DEFAULT false,
  featured             boolean              DEFAULT false,
  applications         integer     NOT NULL DEFAULT 0,
  views                integer     NOT NULL DEFAULT 0,
  closing_date         date,
  tags                 text[],
  languages_required   text[]               DEFAULT '{}'::text[],
  demographics_target  jsonb                DEFAULT '{}'::jsonb,
  regulatory_body_id   uuid        REFERENCES public.regulatory_bodies(id),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- applications
CREATE TABLE public.applications (
  id             uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id uuid        NOT NULL REFERENCES public.opportunities(id),
  applicant_id   uuid        NOT NULL,
  cover_note     text,
  status         text        NOT NULL DEFAULT 'pending',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- audit_logs
CREATE TABLE public.audit_logs (
  id           uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id     uuid        NOT NULL,
  actor_role   text        NOT NULL,
  action       text        NOT NULL,
  entity_type  text        NOT NULL,
  entity_id    text        NOT NULL,
  entity_label text,
  before_data  jsonb,
  after_data   jsonb,
  metadata     jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- document_vault
CREATE TABLE public.document_vault (
  id            uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid        NOT NULL,
  label         text        NOT NULL,
  doc_type      text        NOT NULL,
  file_name     text        NOT NULL,
  file_url      text        NOT NULL,
  file_size     bigint,
  mime_type     text,
  status        text        NOT NULL DEFAULT 'pending',
  expires_at    date,
  reviewed_by   uuid,
  reviewed_at   timestamptz,
  reviewer_note text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- practitioner_accreditations
CREATE TABLE public.practitioner_accreditations (
  id                  uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid        NOT NULL,
  role_type           text        NOT NULL,
  seta_body           text        NOT NULL,
  registration_number text,
  id_number           text,
  status              text        NOT NULL DEFAULT 'active',
  valid_from          date,
  valid_to            date,
  document_url        text,
  raw_extracted       jsonb                DEFAULT '{}'::jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- accreditation_qualifications
CREATE TABLE public.accreditation_qualifications (
  id                 uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  accreditation_id   uuid        NOT NULL REFERENCES public.practitioner_accreditations(id),
  user_id            uuid        NOT NULL,
  title              text        NOT NULL,
  saqa_id            text,
  nqf_level          text,
  credits            integer,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- practitioner_listings
CREATE TABLE public.practitioner_listings (
  id           uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid,
  first_name   text        NOT NULL,
  last_name    text        NOT NULL,
  job_title    text,
  bio          text,
  avatar_url   text,
  email        text,
  phone        text,
  location     text,
  province     text,
  nqf_level    text,
  years_exp    integer,
  skills       text[]               DEFAULT '{}'::text[],
  languages    text[]               DEFAULT '{}'::text[],
  availability text                 DEFAULT 'flexible',
  linkedin_url text,
  status       text        NOT NULL DEFAULT 'active',
  is_verified  boolean     NOT NULL DEFAULT false,
  is_featured  boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- practitioner_listing_accreds
CREATE TABLE public.practitioner_listing_accreds (
  id         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid        NOT NULL REFERENCES public.practitioner_listings(id),
  role_type  text        NOT NULL,
  seta_body  text        NOT NULL,
  reg_number text,
  status     text        NOT NULL DEFAULT 'active',
  valid_from date,
  valid_to   date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- provider_listings
CREATE TABLE public.provider_listings (
  id             uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid        NOT NULL,
  title          text        NOT NULL,
  category       text        NOT NULL,
  description    text,
  pricing_model  text        NOT NULL DEFAULT 'project',
  price_from     numeric,
  price_to       numeric,
  currency       text        NOT NULL DEFAULT 'ZAR',
  location       text,
  services       text[],
  certifications text[],
  portfolio_urls text[],
  rating_avg     numeric     NOT NULL DEFAULT 0,
  review_count   integer     NOT NULL DEFAULT 0,
  status         text        NOT NULL DEFAULT 'active',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- provider_reviews
CREATE TABLE public.provider_reviews (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id  uuid        NOT NULL REFERENCES public.provider_listings(id),
  reviewer_id uuid        NOT NULL,
  rating      integer     NOT NULL,
  comment     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- rfqs
CREATE TABLE public.rfqs (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id    uuid        NOT NULL,
  title       text        NOT NULL,
  description text,
  category    text,
  budget_from numeric,
  budget_to   numeric,
  currency    text        NOT NULL DEFAULT 'ZAR',
  deadline    date,
  requirements jsonb               DEFAULT '{}'::jsonb,
  status      text        NOT NULL DEFAULT 'open',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- rfq_responses
CREATE TABLE public.rfq_responses (
  id           uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_id       uuid        NOT NULL REFERENCES public.rfqs(id),
  provider_id  uuid        NOT NULL,
  listing_id   uuid        REFERENCES public.provider_listings(id),
  proposal     text,
  quote_amount numeric,
  currency     text        NOT NULL DEFAULT 'ZAR',
  timeline     text,
  status       text        NOT NULL DEFAULT 'pending',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- funding_opportunities
CREATE TABLE public.funding_opportunities (
  id                   uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sponsor_id           uuid        NOT NULL,
  title                text        NOT NULL,
  description          text,
  programme_type       text        NOT NULL DEFAULT 'learnership',
  sector               text,
  province             text,
  nqf_level            text,
  seats_available      integer     NOT NULL DEFAULT 1,
  budget_per_learner   numeric,
  total_budget         numeric,
  currency             text        NOT NULL DEFAULT 'ZAR',
  start_date           date,
  application_deadline date,
  duration             text,
  requirements         jsonb       NOT NULL DEFAULT '[]'::jsonb,
  status               text        NOT NULL DEFAULT 'open',
  awarded_to           uuid,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- eoi_submissions
CREATE TABLE public.eoi_submissions (
  id             uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funding_opp_id uuid        NOT NULL REFERENCES public.funding_opportunities(id),
  provider_id    uuid        NOT NULL,
  message        text,
  accreditations jsonb       NOT NULL DEFAULT '[]'::jsonb,
  proposed_start date,
  status         text        NOT NULL DEFAULT 'pending',
  reviewed_at    timestamptz,
  reviewer_note  text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- sponsor_profiles
CREATE TABLE public.sponsor_profiles (
  id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid        NOT NULL,
  company_name    text        NOT NULL,
  tagline         text,
  description     text,
  logo_url        text,
  website_url     text,
  linkedin_url    text,
  contact_email   text,
  contact_phone   text,
  annual_budget   text,
  programme_types text[]               DEFAULT '{}'::text[],
  provinces       text[]               DEFAULT '{}'::text[],
  sectors         text[]               DEFAULT '{}'::text[],
  is_public       boolean     NOT NULL DEFAULT true,
  verified        boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- micro_tasks
CREATE TABLE public.micro_tasks (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  posted_by   uuid        NOT NULL,
  title       text        NOT NULL,
  description text,
  category    text,
  employer    text,
  location    text        NOT NULL DEFAULT 'Remote',
  pay         text,
  duration    text,
  urgency     text        NOT NULL DEFAULT 'Flexible',
  max_workers integer     NOT NULL DEFAULT 1,
  skills      text[],
  status      text        NOT NULL DEFAULT 'available',
  accepted_by uuid,
  escrow_held numeric,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- task_submissions
CREATE TABLE public.task_submissions (
  id            uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id       uuid        NOT NULL REFERENCES public.micro_tasks(id),
  worker_id     uuid        NOT NULL,
  status        text        NOT NULL DEFAULT 'in_progress',
  proof_url     text,
  proof_text    text,
  quality_score smallint,
  earnings      numeric,
  timer_seconds integer     NOT NULL DEFAULT 0,
  started_at    timestamptz NOT NULL DEFAULT now(),
  submitted_at  timestamptz,
  reviewed_at   timestamptz,
  reviewer_note text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- task_ratings
CREATE TABLE public.task_ratings (
  id         uuid      NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id    uuid      NOT NULL REFERENCES public.micro_tasks(id),
  rater_id   uuid      NOT NULL,
  ratee_id   uuid      NOT NULL,
  role       text      NOT NULL,
  rating     smallint  NOT NULL,
  comment    text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- match_results
CREATE TABLE public.match_results (
  id             uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid        NOT NULL,
  opportunity_id uuid        NOT NULL REFERENCES public.opportunities(id),
  score          integer     NOT NULL DEFAULT 0,
  explanation    text,
  factors        jsonb                DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- payment_transactions
CREATE TABLE public.payment_transactions (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL,
  type        text        NOT NULL,
  gateway     text        NOT NULL,
  gateway_ref text,
  amount      numeric     NOT NULL,
  currency    text        NOT NULL DEFAULT 'ZAR',
  status      text        NOT NULL DEFAULT 'pending',
  metadata    jsonb                DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- withdrawal_requests
CREATE TABLE public.withdrawal_requests (
  id               uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid        NOT NULL,
  amount           numeric     NOT NULL,
  currency         text        NOT NULL DEFAULT 'ZAR',
  method           text        NOT NULL,
  bank_name        text,
  account_holder   text,
  account_number   text,
  mobile_number    text,
  status           text        NOT NULL DEFAULT 'pending',
  rejection_reason text,
  processed_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- reports
CREATE TABLE public.reports (
  id                 uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            uuid        NOT NULL,
  regulatory_body_id uuid        REFERENCES public.regulatory_bodies(id),
  report_type        text        NOT NULL,
  financial_year     text        NOT NULL,
  status             text        NOT NULL DEFAULT 'generated',
  data_snapshot      jsonb       NOT NULL DEFAULT '{}'::jsonb,
  output_url         text,
  submission_notes   text,
  generated_at       timestamptz NOT NULL DEFAULT now(),
  submitted_at       timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- company_participants
CREATE TABLE public.company_participants (
  id                    uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id        uuid        NOT NULL REFERENCES public.opportunities(id),
  user_id               uuid        NOT NULL,
  company_name          text        NOT NULL,
  role                  text        NOT NULL,
  cost_share_percentage numeric              DEFAULT 0,
  bbbee_points_allocated numeric             DEFAULT 0,
  agreement_document_url text,
  notes                 text,
  status                text        NOT NULL DEFAULT 'active',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.subscriptions (user_id, plan) VALUES (NEW.id, 'starter') ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.wallets (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_opportunity_applications()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.opportunities SET applications = applications + 1 WHERE id = NEW.opportunity_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_opportunity_applications()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.opportunities SET applications = GREATEST(0, applications - 1) WHERE id = OLD.opportunity_id;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_review_rating()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_listing_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.provider_listings SET
    rating_avg   = (SELECT COALESCE(AVG(rating), 0) FROM public.provider_reviews WHERE listing_id = COALESCE(NEW.listing_id, OLD.listing_id)),
    review_count = (SELECT COUNT(*) FROM public.provider_reviews WHERE listing_id = COALESCE(NEW.listing_id, OLD.listing_id))
  WHERE id = COALESCE(NEW.listing_id, OLD.listing_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_bodies           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_vault              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practitioner_accreditations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accreditation_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practitioner_listings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practitioner_listing_accreds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_listings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_reviews            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfqs                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_responses               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_opportunities       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eoi_submissions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.micro_tasks                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_ratings                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_participants        ENABLE ROW LEVEL SECURITY;

-- ── profiles ──────────────────────────────────────────────
CREATE POLICY "Authenticated users view profiles"   ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view their own profile"    ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile"  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile"  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- ── user_roles ────────────────────────────────────────────
CREATE POLICY "Users can view their own roles"   ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own roles" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── subscriptions ─────────────────────────────────────────
CREATE POLICY "Users can view their own subscription"   ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscription" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscription" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- ── wallets ───────────────────────────────────────────────
CREATE POLICY "Users view own wallet"   ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own wallet" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own wallet" ON public.wallets FOR UPDATE USING (auth.uid() = user_id);

-- ── regulatory_bodies ─────────────────────────────────────
CREATE POLICY "Public read active regulatory bodies" ON public.regulatory_bodies FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage regulatory bodies"      ON public.regulatory_bodies FOR ALL   USING (has_role(auth.uid(), 'admin'));

-- ── opportunities ─────────────────────────────────────────
CREATE POLICY "Anyone can view active opportunities" ON public.opportunities FOR SELECT USING (status = 'active');
CREATE POLICY "Poster can insert own opportunity"    ON public.opportunities FOR INSERT WITH CHECK (auth.uid() = posted_by);
CREATE POLICY "Poster can update own opportunity"    ON public.opportunities FOR UPDATE USING (auth.uid() = posted_by);
CREATE POLICY "Poster can delete own opportunity"    ON public.opportunities FOR DELETE USING (auth.uid() = posted_by);

-- ── applications ──────────────────────────────────────────
CREATE POLICY "Applicant views own applications"         ON public.applications FOR SELECT USING (auth.uid() = applicant_id);
CREATE POLICY "Applicant submits application"            ON public.applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Applicant can withdraw application"       ON public.applications FOR DELETE USING (auth.uid() = applicant_id);
CREATE POLICY "Poster views applications on own listings" ON public.applications FOR SELECT USING (EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = applications.opportunity_id AND o.posted_by = auth.uid()));
CREATE POLICY "Poster updates application status"        ON public.applications FOR UPDATE USING (EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = applications.opportunity_id AND o.posted_by = auth.uid()));

-- ── audit_logs ────────────────────────────────────────────
CREATE POLICY "Actors insert own audit logs"  ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = actor_id);
CREATE POLICY "Admins read all audit logs"    ON public.audit_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "SETA reads audit logs"         ON public.audit_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'seta'));
CREATE POLICY "Government reads audit logs"   ON public.audit_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'government'));
CREATE POLICY "Users read own audit trail"    ON public.audit_logs FOR SELECT TO authenticated USING (auth.uid() = actor_id);

-- ── document_vault ────────────────────────────────────────
CREATE POLICY "Users view own documents"          ON public.document_vault FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own documents"        ON public.document_vault FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own pending documents" ON public.document_vault FOR DELETE USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins view all documents"         ON public.document_vault FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'seta'));
CREATE POLICY "Admins update document status"     ON public.document_vault FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'seta'));

-- ── practitioner_accreditations ───────────────────────────
CREATE POLICY "Users view own accreditations"                ON public.practitioner_accreditations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own accreditations"              ON public.practitioner_accreditations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own accreditations"              ON public.practitioner_accreditations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own accreditations"              ON public.practitioner_accreditations FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users view active accreditations" ON public.practitioner_accreditations FOR SELECT TO authenticated USING (status = 'active');
CREATE POLICY "Admins manage all accreditations"             ON public.practitioner_accreditations FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ── accreditation_qualifications ──────────────────────────
CREATE POLICY "Users view own qualifications"   ON public.accreditation_qualifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own qualifications" ON public.accreditation_qualifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own qualifications" ON public.accreditation_qualifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage qualifications"    ON public.accreditation_qualifications FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ── practitioner_listings ─────────────────────────────────
CREATE POLICY "Public view active practitioner listings" ON public.practitioner_listings FOR SELECT TO authenticated USING (status = 'active');
CREATE POLICY "Owner manages own listing"                ON public.practitioner_listings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage practitioner listings"      ON public.practitioner_listings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ── practitioner_listing_accreds ──────────────────────────
CREATE POLICY "Public view practitioner listing accreds"  ON public.practitioner_listing_accreds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage practitioner listing accreds" ON public.practitioner_listing_accreds FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ── provider_listings ─────────────────────────────────────
CREATE POLICY "Anyone views active provider listings" ON public.provider_listings FOR SELECT USING (status = 'active');
CREATE POLICY "Owner views own listings"              ON public.provider_listings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owner inserts listing"                 ON public.provider_listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner updates listing"                 ON public.provider_listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owner deletes listing"                 ON public.provider_listings FOR DELETE USING (auth.uid() = user_id);

-- ── provider_reviews ──────────────────────────────────────
CREATE POLICY "Anyone views reviews"            ON public.provider_reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users add reviews" ON public.provider_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Reviewer deletes own review"     ON public.provider_reviews FOR DELETE USING (auth.uid() = reviewer_id);

-- ── rfqs ──────────────────────────────────────────────────
CREATE POLICY "Buyer manages own RFQs"  ON public.rfqs FOR ALL  USING (auth.uid() = buyer_id);
CREATE POLICY "Providers view open RFQs" ON public.rfqs FOR SELECT USING (status = 'open');

-- ── rfq_responses ─────────────────────────────────────────
CREATE POLICY "Provider manages own responses"      ON public.rfq_responses FOR ALL    USING (auth.uid() = provider_id);
CREATE POLICY "Buyer views responses to own RFQs"  ON public.rfq_responses FOR SELECT USING (EXISTS (SELECT 1 FROM public.rfqs r WHERE r.id = rfq_responses.rfq_id AND r.buyer_id = auth.uid()));
CREATE POLICY "Buyer updates response status"       ON public.rfq_responses FOR UPDATE USING (EXISTS (SELECT 1 FROM public.rfqs r WHERE r.id = rfq_responses.rfq_id AND r.buyer_id = auth.uid()));

-- ── funding_opportunities ─────────────────────────────────
CREATE POLICY "Public view open funding opportunities"    ON public.funding_opportunities FOR SELECT USING (status = 'open');
CREATE POLICY "Sponsor views own funding opportunities"   ON public.funding_opportunities FOR SELECT USING (auth.uid() = sponsor_id);
CREATE POLICY "Sponsor inserts own funding opportunities" ON public.funding_opportunities FOR INSERT WITH CHECK (auth.uid() = sponsor_id);
CREATE POLICY "Sponsor updates own funding opportunities" ON public.funding_opportunities FOR UPDATE USING (auth.uid() = sponsor_id);
CREATE POLICY "Sponsor deletes own funding opportunities" ON public.funding_opportunities FOR DELETE USING (auth.uid() = sponsor_id);
CREATE POLICY "Admins manage all funding opportunities"   ON public.funding_opportunities FOR ALL   USING (has_role(auth.uid(), 'admin'));

-- ── eoi_submissions ───────────────────────────────────────
CREATE POLICY "Provider views own EOIs"             ON public.eoi_submissions FOR SELECT USING (auth.uid() = provider_id);
CREATE POLICY "Provider submits EOI"                ON public.eoi_submissions FOR INSERT WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Provider updates own pending EOI"    ON public.eoi_submissions FOR UPDATE USING (auth.uid() = provider_id AND status = 'pending');
CREATE POLICY "Provider withdraws own pending EOI"  ON public.eoi_submissions FOR DELETE USING (auth.uid() = provider_id AND status = 'pending');
CREATE POLICY "Sponsor views EOIs on own opportunities" ON public.eoi_submissions FOR SELECT USING (EXISTS (SELECT 1 FROM public.funding_opportunities fo WHERE fo.id = eoi_submissions.funding_opp_id AND fo.sponsor_id = auth.uid()));
CREATE POLICY "Sponsor updates EOI status on own opportunities" ON public.eoi_submissions FOR UPDATE USING (EXISTS (SELECT 1 FROM public.funding_opportunities fo WHERE fo.id = eoi_submissions.funding_opp_id AND fo.sponsor_id = auth.uid()));
CREATE POLICY "Admins manage all EOIs"              ON public.eoi_submissions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ── sponsor_profiles ──────────────────────────────────────
CREATE POLICY "Public view published sponsor profiles" ON public.sponsor_profiles FOR SELECT USING (is_public = true);
CREATE POLICY "Sponsor views own profile"              ON public.sponsor_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Sponsor inserts own profile"            ON public.sponsor_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Sponsor updates own profile"            ON public.sponsor_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Sponsor deletes own profile"            ON public.sponsor_profiles FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all sponsor profiles"     ON public.sponsor_profiles FOR ALL   USING (has_role(auth.uid(), 'admin'));

-- ── micro_tasks ───────────────────────────────────────────
CREATE POLICY "Poster inserts own micro_task"    ON public.micro_tasks FOR INSERT WITH CHECK (auth.uid() = posted_by);
CREATE POLICY "Poster updates own micro_task"    ON public.micro_tasks FOR UPDATE USING (auth.uid() = posted_by);
CREATE POLICY "Poster deletes own micro_task"    ON public.micro_tasks FOR DELETE USING (auth.uid() = posted_by);
CREATE POLICY "Poster views own tasks"           ON public.micro_tasks FOR SELECT TO authenticated USING (auth.uid() = posted_by);
CREATE POLICY "Learners browse available tasks"  ON public.micro_tasks FOR SELECT TO authenticated USING ((status = 'active') OR (status = 'available' AND has_role(auth.uid(), 'learner')));
CREATE POLICY "Admins view all micro_tasks"      ON public.micro_tasks FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ── task_submissions ──────────────────────────────────────
CREATE POLICY "Worker inserts own submission"             ON public.task_submissions FOR INSERT WITH CHECK (auth.uid() = worker_id);
CREATE POLICY "Worker updates in_progress submission"     ON public.task_submissions FOR UPDATE USING (auth.uid() = worker_id);
CREATE POLICY "Worker views own submissions"              ON public.task_submissions FOR SELECT USING (auth.uid() = worker_id);
CREATE POLICY "Poster views submissions on own tasks"     ON public.task_submissions FOR SELECT USING (EXISTS (SELECT 1 FROM public.micro_tasks t WHERE t.id = task_submissions.task_id AND t.posted_by = auth.uid()));
CREATE POLICY "Poster reviews submissions on own tasks"   ON public.task_submissions FOR UPDATE USING (EXISTS (SELECT 1 FROM public.micro_tasks t WHERE t.id = task_submissions.task_id AND t.posted_by = auth.uid()));

-- ── task_ratings ──────────────────────────────────────────
CREATE POLICY "Anyone views task ratings"         ON public.task_ratings FOR SELECT USING (true);
CREATE POLICY "Authenticated users create ratings" ON public.task_ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);

-- ── match_results ─────────────────────────────────────────
CREATE POLICY "Users view own matches"   ON public.match_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users upsert own matches" ON public.match_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own matches" ON public.match_results FOR UPDATE USING (auth.uid() = user_id);

-- ── payment_transactions ──────────────────────────────────
CREATE POLICY "Users view own transactions" ON public.payment_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service inserts transactions" ON public.payment_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── withdrawal_requests ───────────────────────────────────
CREATE POLICY "Users view own withdrawals"   ON public.withdrawal_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own withdrawals" ON public.withdrawal_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own withdrawals" ON public.withdrawal_requests FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- ── reports ───────────────────────────────────────────────
CREATE POLICY "Users view own reports"   ON public.reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reports" ON public.reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all reports" ON public.reports FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ── company_participants ──────────────────────────────────
CREATE POLICY "Participant views own record"               ON public.company_participants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Poster manages participants on own opportunity" ON public.company_participants FOR ALL USING (EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = company_participants.opportunity_id AND o.posted_by = auth.uid()));
CREATE POLICY "Admins manage all participants"             ON public.company_participants FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============================================================
-- END OF SCHEMA
-- ============================================================
