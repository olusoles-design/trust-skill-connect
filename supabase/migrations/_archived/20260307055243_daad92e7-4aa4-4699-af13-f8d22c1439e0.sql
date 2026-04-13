
-- ══════════════════════════════════════════════════════════════════
-- Phase 3: Data Layer — Opportunities, Applications, Micro-Tasks
-- ══════════════════════════════════════════════════════════════════

-- ─── 1. Extend profiles with skills / bio ──────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio             TEXT,
  ADD COLUMN IF NOT EXISTS skills          TEXT[],
  ADD COLUMN IF NOT EXISTS location        TEXT,
  ADD COLUMN IF NOT EXISTS id_number       TEXT,
  ADD COLUMN IF NOT EXISTS company_name    TEXT,
  ADD COLUMN IF NOT EXISTS job_title       TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url    TEXT,
  ADD COLUMN IF NOT EXISTS website_url     TEXT;

-- ─── 2. Storage buckets ────────────────────────────────────────

-- Avatar bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Documents bucket (private — per-user access only)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies — avatars (public read, owner write)
CREATE POLICY "Avatars public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies — documents (owner-only)
CREATE POLICY "Users read own documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ─── 3. Opportunities table ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.opportunities (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by      UUID NOT NULL,           -- references auth user
  title          TEXT NOT NULL,
  description    TEXT,
  organisation   TEXT,
  type           TEXT NOT NULL DEFAULT 'job',   -- job | learnership | gig | programme | apprenticeship | bursary
  category       TEXT,                           -- ICT | Construction | Finance | Health | Education | …
  location       TEXT,
  stipend        TEXT,
  duration       TEXT,
  closing_date   DATE,
  seta           TEXT,
  bbee_points    BOOLEAN DEFAULT false,
  verified       BOOLEAN DEFAULT false,
  featured       BOOLEAN DEFAULT false,
  status         TEXT NOT NULL DEFAULT 'active', -- active | draft | closed
  tags           TEXT[],
  applications   INT NOT NULL DEFAULT 0,
  views          INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Everyone can view active/featured opportunities
CREATE POLICY "Anyone can view active opportunities"
  ON public.opportunities FOR SELECT
  USING (status = 'active');

-- Poster can manage their own
CREATE POLICY "Poster can insert own opportunity"
  ON public.opportunities FOR INSERT
  WITH CHECK (auth.uid() = posted_by);

CREATE POLICY "Poster can update own opportunity"
  ON public.opportunities FOR UPDATE
  USING (auth.uid() = posted_by);

CREATE POLICY "Poster can delete own opportunity"
  ON public.opportunities FOR DELETE
  USING (auth.uid() = posted_by);

-- Trigger: auto-update updated_at
CREATE TRIGGER opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for common filters
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON public.opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_type ON public.opportunities(type);
CREATE INDEX IF NOT EXISTS idx_opportunities_posted_by ON public.opportunities(posted_by);

-- ─── 4. Applications table ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.applications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id   UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  applicant_id     UUID NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending',  -- pending | shortlisted | accepted | rejected
  cover_note       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (opportunity_id, applicant_id)
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Applicant sees own applications
CREATE POLICY "Applicant views own applications"
  ON public.applications FOR SELECT
  USING (auth.uid() = applicant_id);

-- Opportunity poster sees applications on their listings
CREATE POLICY "Poster views applications on own listings"
  ON public.applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.opportunities o
      WHERE o.id = opportunity_id AND o.posted_by = auth.uid()
    )
  );

CREATE POLICY "Applicant submits application"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Applicant can withdraw application"
  ON public.applications FOR DELETE
  USING (auth.uid() = applicant_id);

-- Poster can update status (shortlist / accept / reject)
CREATE POLICY "Poster updates application status"
  ON public.applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.opportunities o
      WHERE o.id = opportunity_id AND o.posted_by = auth.uid()
    )
  );

CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-increment opportunity.applications count
CREATE OR REPLACE FUNCTION public.increment_opportunity_applications()
  RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.opportunities SET applications = applications + 1 WHERE id = NEW.opportunity_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER after_application_insert
  AFTER INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.increment_opportunity_applications();

CREATE OR REPLACE FUNCTION public.decrement_opportunity_applications()
  RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.opportunities SET applications = GREATEST(0, applications - 1) WHERE id = OLD.opportunity_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER after_application_delete
  AFTER DELETE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.decrement_opportunity_applications();

CREATE INDEX IF NOT EXISTS idx_applications_applicant ON public.applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity ON public.applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);

-- ─── 5. Micro-tasks table ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.micro_tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by    UUID NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  category     TEXT,
  pay          TEXT,
  duration     TEXT,
  location     TEXT NOT NULL DEFAULT 'Remote',  -- Remote | On-site | Hybrid
  urgency      TEXT NOT NULL DEFAULT 'Flexible', -- Today | This week | Flexible
  skills       TEXT[],
  employer     TEXT,
  status       TEXT NOT NULL DEFAULT 'available', -- available | closed
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.micro_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views available micro_tasks"
  ON public.micro_tasks FOR SELECT
  USING (status = 'available');

CREATE POLICY "Poster inserts own micro_task"
  ON public.micro_tasks FOR INSERT
  WITH CHECK (auth.uid() = posted_by);

CREATE POLICY "Poster updates own micro_task"
  ON public.micro_tasks FOR UPDATE
  USING (auth.uid() = posted_by);

CREATE POLICY "Poster deletes own micro_task"
  ON public.micro_tasks FOR DELETE
  USING (auth.uid() = posted_by);

CREATE TRIGGER micro_tasks_updated_at
  BEFORE UPDATE ON public.micro_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_micro_tasks_status ON public.micro_tasks(status);
CREATE INDEX IF NOT EXISTS idx_micro_tasks_urgency ON public.micro_tasks(urgency);

-- ─── 6. Seed public opportunities from mock data ───────────────

-- Seed user will be the system — no auth.uid() constraint here since we use the migration tool
-- We leave seeding to app code via the supabase client (posted_by = current user on first post).
-- However we CAN seed some sample data attributed to a placeholder UUID for browse widget demo.
-- Note: posted_by won't match any real user, but RLS only gates INSERT/UPDATE/DELETE, not SELECT(active).

INSERT INTO public.opportunities (id, posted_by, title, description, organisation, type, category, location, stipend, duration, closing_date, seta, bbee_points, verified, featured, status, tags)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'ICT Systems Support Learnership', 'Join our NQF Level 4 ICT: Systems Support learnership. Gain hands-on experience in networking, hardware maintenance and IT support.', 'TechCorp SA', 'learnership', 'ICT', 'Cape Town, WC', 'R 4 200 / month', '12 months', '2026-04-30', 'MICT SETA', true, true, true, 'active', ARRAY['NQF 4','IT Support','Networking']),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'Finance & Accounting Graduate Programme', 'A structured 2-year graduate programme for BCom graduates. Rotations through audit, tax, and advisory business units.', 'CapitalEdge Group', 'programme', 'Finance', 'Sandton, GP', 'R 12 000 / month', '24 months', '2026-05-15', 'FASSET', true, true, true, 'active', ARRAY['BCom','Graduate','Finance']),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'Construction Site Supervisor Apprenticeship', 'Hands-on apprenticeship combining on-site learning with technical college attendance. Leads to trade test certification.', 'BuildRight Contractors', 'apprenticeship', 'Construction', 'Durban, KZN', 'R 6 500 / month', '18 months', '2026-04-10', 'CETA', false, true, true, 'active', ARRAY['Trade','NQF 3','Site Management']),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'Healthcare Support Worker Learnership', 'NQF Level 3 Healthcare Support learnership. Theory and workplace experience across clinics and hospitals.', 'MediLearn Foundation', 'learnership', 'Health', 'Pretoria, GP', 'R 3 800 / month', '12 months', '2026-06-01', 'HWSETA', true, true, false, 'active', ARRAY['Healthcare','NQF 3','Community Health']),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'Digital Marketing Specialist (Contract Gig)', 'Short-term contract for a digital marketing specialist. Focus on social media strategy, content creation and paid campaigns.', 'PixelPulse Agency', 'gig', 'ICT', 'Remote', 'R 8 000 / project', '3 months', '2026-03-31', NULL, false, false, false, 'active', ARRAY['Remote','Contract','Marketing']),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'Agricultural Practices NQF 2 Learnership', 'Entry-level agri learnership covering crop management, soil science and sustainable farming practices.', 'GreenField Agri', 'learnership', 'Agriculture', 'Stellenbosch, WC', 'R 3 200 / month', '12 months', '2026-05-30', 'AgriSeta', true, true, false, 'active', ARRAY['Agriculture','NQF 2','Rural']),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'Early Childhood Development Bursary', 'Full bursary covering tuition and accommodation for qualifying students pursuing a Diploma in Early Childhood Development.', 'EduCare Trust', 'bursary', 'Education', 'Nationwide', NULL, '3 years', '2026-04-15', 'ETDP SETA', false, true, false, 'active', ARRAY['Bursary','ECD','Diploma']),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'Electrical Engineering Learnership', 'NQF Level 4 Electrical Engineering learnership with focus on installation, maintenance and fault finding.', 'PowerGrid Utilities', 'learnership', 'Engineering', 'Johannesburg, GP', 'R 7 500 / month', '24 months', '2026-07-01', 'MERSETA', true, true, false, 'active', ARRAY['Engineering','NQF 4','Trade'])
ON CONFLICT (id) DO NOTHING;

-- Seed micro-tasks
INSERT INTO public.micro_tasks (id, posted_by, title, category, pay, duration, location, urgency, skills, employer, status)
VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'Data Capture & Spreadsheet Clean-up', 'Admin', 'R480', '4 hrs', 'Remote', 'Today', ARRAY['Excel','Data Entry'], 'Tiger Brands', 'available'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'Social Media Content Scheduling', 'Marketing', 'R350', '3 hrs', 'Remote', 'Today', ARRAY['Canva','Scheduling tools'], 'Cape Creative Co.', 'available'),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'Venue Setup & Event Support', 'Events', 'R700', '7 hrs', 'On-site', 'This week', ARRAY['Physical labour','Customer service'], 'Sandton Events', 'available'),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'Customer Service Call Handling', 'CX', 'R250/hr', 'Shift', 'Hybrid', 'This week', ARRAY['Communication','CRM'], 'Telkom', 'available'),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'Inventory Count & Labelling', 'Warehouse', 'R920', '8 hrs', 'On-site', 'Flexible', ARRAY['Counting','Attention to detail'], 'Massmart', 'available')
ON CONFLICT (id) DO NOTHING;
