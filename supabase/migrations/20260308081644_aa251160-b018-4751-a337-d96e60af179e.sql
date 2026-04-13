
-- ─── 1. Add regulatory_body_id FK to opportunities ───────────────────────────
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS regulatory_body_id UUID REFERENCES public.regulatory_bodies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_regulatory_body
  ON public.opportunities(regulatory_body_id);

-- ─── 2. company_participants table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.company_participants (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id        UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  -- Profile of the company rep / the employer user
  user_id               UUID NOT NULL,
  company_name          TEXT NOT NULL,
  role                  TEXT NOT NULL CHECK (role IN ('lead','host','funder')),
  cost_share_percentage NUMERIC(5,2) DEFAULT 0 CHECK (cost_share_percentage >= 0 AND cost_share_percentage <= 100),
  bbbee_points_allocated NUMERIC(5,2) DEFAULT 0,
  agreement_document_url TEXT,
  status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','removed')),
  notes                 TEXT,
  created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Only one lead per opportunity
  UNIQUE (opportunity_id, role) DEFERRABLE INITIALLY DEFERRED
);

-- Remove the overly strict unique constraint on role (multiple hosts allowed)
ALTER TABLE public.company_participants DROP CONSTRAINT IF EXISTS company_participants_opportunity_id_role_key;

-- Correct unique: only ONE lead per opportunity
CREATE UNIQUE INDEX IF NOT EXISTS uq_company_participants_lead
  ON public.company_participants(opportunity_id)
  WHERE role = 'lead';

CREATE INDEX IF NOT EXISTS idx_company_participants_opportunity
  ON public.company_participants(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_company_participants_user
  ON public.company_participants(user_id);

-- ─── 3. RLS for company_participants ──────────────────────────────────────────
ALTER TABLE public.company_participants ENABLE ROW LEVEL SECURITY;

-- Opportunity poster (lead) manages all participants on their opportunities
CREATE POLICY "Poster manages participants on own opportunity"
  ON public.company_participants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.opportunities o
      WHERE o.id = company_participants.opportunity_id
        AND o.posted_by = auth.uid()
    )
  );

-- Participants can view their own record
CREATE POLICY "Participant views own record"
  ON public.company_participants FOR SELECT
  USING (auth.uid() = user_id);

-- Admins see everything
CREATE POLICY "Admins manage all participants"
  ON public.company_participants FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ─── 4. auto-updated_at trigger ───────────────────────────────────────────────
CREATE TRIGGER update_company_participants_updated_at
  BEFORE UPDATE ON public.company_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── 5. reports table (persisted report snapshots) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL,
  regulatory_body_id UUID REFERENCES public.regulatory_bodies(id) ON DELETE SET NULL,
  report_type       TEXT NOT NULL,           -- 'WSP', 'ATR', 'Pivotal', 'OFO', 'CPD'
  financial_year    TEXT NOT NULL,           -- e.g. '2024-25'
  status            TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('generated','submitted','rejected')),
  output_url        TEXT,                    -- storage path to CSV/XLSX
  data_snapshot     JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  submitted_at      TIMESTAMP WITH TIME ZONE,
  submission_notes  TEXT,
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own reports"
  ON public.reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all reports"
  ON public.reports FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_reports_user ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_body ON public.reports(regulatory_body_id);

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
