
-- ── funding_opportunities: Sponsor-posted funding briefs ─────────────────────
CREATE TABLE public.funding_opportunities (
  id                  UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sponsor_id          UUID    NOT NULL,
  title               TEXT    NOT NULL,
  programme_type      TEXT    NOT NULL DEFAULT 'learnership',
  description         TEXT,
  sector              TEXT,
  nqf_level           TEXT,
  seats_available     INTEGER NOT NULL DEFAULT 1,
  budget_per_learner  NUMERIC,
  total_budget        NUMERIC,
  currency            TEXT    NOT NULL DEFAULT 'ZAR',
  province            TEXT,
  duration            TEXT,
  start_date          DATE,
  application_deadline DATE,
  requirements        JSONB   NOT NULL DEFAULT '[]'::JSONB,
  status              TEXT    NOT NULL DEFAULT 'open',
  awarded_to          UUID,
  created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.funding_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view open funding opportunities"
  ON public.funding_opportunities FOR SELECT
  USING (status = 'open');

CREATE POLICY "Sponsor views own funding opportunities"
  ON public.funding_opportunities FOR SELECT
  USING (auth.uid() = sponsor_id);

CREATE POLICY "Sponsor inserts own funding opportunities"
  ON public.funding_opportunities FOR INSERT
  WITH CHECK (auth.uid() = sponsor_id);

CREATE POLICY "Sponsor updates own funding opportunities"
  ON public.funding_opportunities FOR UPDATE
  USING (auth.uid() = sponsor_id);

CREATE POLICY "Sponsor deletes own funding opportunities"
  ON public.funding_opportunities FOR DELETE
  USING (auth.uid() = sponsor_id);

CREATE POLICY "Admins manage all funding opportunities"
  ON public.funding_opportunities FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_funding_opportunities_updated_at
  BEFORE UPDATE ON public.funding_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ── eoi_submissions: Provider expressions of interest ─────────────────────────
CREATE TABLE public.eoi_submissions (
  id                  UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funding_opp_id      UUID    NOT NULL REFERENCES public.funding_opportunities(id) ON DELETE CASCADE,
  provider_id         UUID    NOT NULL,
  message             TEXT,
  accreditations      JSONB   NOT NULL DEFAULT '[]'::JSONB,
  proposed_start      DATE,
  status              TEXT    NOT NULL DEFAULT 'pending',
  reviewed_at         TIMESTAMP WITH TIME ZONE,
  reviewer_note       TEXT,
  created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (funding_opp_id, provider_id)
);

ALTER TABLE public.eoi_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider views own EOIs"
  ON public.eoi_submissions FOR SELECT
  USING (auth.uid() = provider_id);

CREATE POLICY "Provider submits EOI"
  ON public.eoi_submissions FOR INSERT
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Provider updates own pending EOI"
  ON public.eoi_submissions FOR UPDATE
  USING (auth.uid() = provider_id AND status = 'pending');

CREATE POLICY "Provider withdraws own pending EOI"
  ON public.eoi_submissions FOR DELETE
  USING (auth.uid() = provider_id AND status = 'pending');

CREATE POLICY "Sponsor views EOIs on own opportunities"
  ON public.eoi_submissions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.funding_opportunities fo
    WHERE fo.id = eoi_submissions.funding_opp_id AND fo.sponsor_id = auth.uid()
  ));

CREATE POLICY "Sponsor updates EOI status on own opportunities"
  ON public.eoi_submissions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.funding_opportunities fo
    WHERE fo.id = eoi_submissions.funding_opp_id AND fo.sponsor_id = auth.uid()
  ));

CREATE POLICY "Admins manage all EOIs"
  ON public.eoi_submissions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_eoi_submissions_updated_at
  BEFORE UPDATE ON public.eoi_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
