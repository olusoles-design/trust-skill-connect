
-- ══════════════════════════════════════════════════════════════
-- Phase 4: Matching Engine, Marketplace & Procurement Tables
-- ══════════════════════════════════════════════════════════════

-- ─── 1. Extend profiles for matching algorithm ───────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nqf_level    TEXT,
  ADD COLUMN IF NOT EXISTS demographics JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS languages    TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'flexible';

-- ─── 2. Extend opportunities for matching ────────────────────
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS nqf_level_required  TEXT,
  ADD COLUMN IF NOT EXISTS demographics_target JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS languages_required  TEXT[] DEFAULT '{}';

-- ─── 3. Match Results (cached AI scores) ─────────────────────
CREATE TABLE IF NOT EXISTS public.match_results (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  score          INT NOT NULL DEFAULT 0,
  factors        JSONB DEFAULT '{}'::jsonb,
  explanation    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, opportunity_id)
);

ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own matches"
  ON public.match_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users upsert own matches"
  ON public.match_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own matches"
  ON public.match_results FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER match_results_updated_at
  BEFORE UPDATE ON public.match_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_match_results_user ON public.match_results(user_id);
CREATE INDEX IF NOT EXISTS idx_match_results_score ON public.match_results(user_id, score DESC);

-- Enable realtime for match_results
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_results;

-- ─── 4. Provider Listings ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.provider_listings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL,
  title          TEXT NOT NULL,
  category       TEXT NOT NULL,        -- learning_material | furniture_equipment | reprographics | training_equipment | venue_facility | technology
  description    TEXT,
  pricing_model  TEXT NOT NULL DEFAULT 'project',  -- fixed | hourly | project
  price_from     NUMERIC,
  price_to       NUMERIC,
  currency       TEXT NOT NULL DEFAULT 'ZAR',
  location       TEXT,
  certifications TEXT[],
  services       TEXT[],
  portfolio_urls TEXT[],
  status         TEXT NOT NULL DEFAULT 'active',
  rating_avg     NUMERIC NOT NULL DEFAULT 0,
  review_count   INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views active provider listings"
  ON public.provider_listings FOR SELECT
  USING (status = 'active');

CREATE POLICY "Owner views own listings"
  ON public.provider_listings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner inserts listing"
  ON public.provider_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner updates listing"
  ON public.provider_listings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owner deletes listing"
  ON public.provider_listings FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER provider_listings_updated_at
  BEFORE UPDATE ON public.provider_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_provider_listings_category ON public.provider_listings(category);
CREATE INDEX IF NOT EXISTS idx_provider_listings_user ON public.provider_listings(user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.provider_listings;

-- ─── 5. Provider Reviews ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.provider_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  UUID NOT NULL REFERENCES public.provider_listings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  rating      INT NOT NULL,
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (listing_id, reviewer_id)
);

ALTER TABLE public.provider_reviews ENABLE ROW LEVEL SECURITY;

-- Validation trigger (no CHECK constraint for immutable concerns)
CREATE OR REPLACE FUNCTION public.validate_review_rating()
  RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_review_rating
  BEFORE INSERT OR UPDATE ON public.provider_reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_review_rating();

CREATE POLICY "Anyone views reviews"
  ON public.provider_reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users add reviews"
  ON public.provider_reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviewer deletes own review"
  ON public.provider_reviews FOR DELETE
  USING (auth.uid() = reviewer_id);

-- Trigger to keep rating_avg updated on provider_listings
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

CREATE TRIGGER after_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.provider_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_listing_rating();

-- ─── 6. RFQs (Request for Quotes / Procurement) ───────────────
CREATE TABLE IF NOT EXISTS public.rfqs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id    UUID NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  category    TEXT,
  budget_from NUMERIC,
  budget_to   NUMERIC,
  currency    TEXT NOT NULL DEFAULT 'ZAR',
  deadline    DATE,
  status      TEXT NOT NULL DEFAULT 'open',   -- open | reviewing | awarded | closed
  requirements JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyer manages own RFQs"
  ON public.rfqs FOR ALL
  USING (auth.uid() = buyer_id);

CREATE POLICY "Providers view open RFQs"
  ON public.rfqs FOR SELECT
  USING (status = 'open');

CREATE TRIGGER rfqs_updated_at
  BEFORE UPDATE ON public.rfqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_rfqs_buyer ON public.rfqs(buyer_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON public.rfqs(status);

ALTER PUBLICATION supabase_realtime ADD TABLE public.rfqs;

-- ─── 7. RFQ Responses (Quotes from providers) ────────────────
CREATE TABLE IF NOT EXISTS public.rfq_responses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id       UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  provider_id  UUID NOT NULL,
  listing_id   UUID REFERENCES public.provider_listings(id),
  quote_amount NUMERIC,
  currency     TEXT NOT NULL DEFAULT 'ZAR',
  proposal     TEXT,
  timeline     TEXT,
  status       TEXT NOT NULL DEFAULT 'pending',  -- pending | shortlisted | accepted | rejected
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rfq_id, provider_id)
);

ALTER TABLE public.rfq_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider manages own responses"
  ON public.rfq_responses FOR ALL
  USING (auth.uid() = provider_id);

CREATE POLICY "Buyer views responses to own RFQs"
  ON public.rfq_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rfqs r WHERE r.id = rfq_id AND r.buyer_id = auth.uid()
    )
  );

CREATE POLICY "Buyer updates response status"
  ON public.rfq_responses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.rfqs r WHERE r.id = rfq_id AND r.buyer_id = auth.uid()
    )
  );

CREATE TRIGGER rfq_responses_updated_at
  BEFORE UPDATE ON public.rfq_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_rfq_responses_rfq ON public.rfq_responses(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_responses_provider ON public.rfq_responses(provider_id);
