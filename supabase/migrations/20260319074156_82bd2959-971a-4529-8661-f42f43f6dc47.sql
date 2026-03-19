
-- ============================================================
-- ENHANCED PRACTITIONER PORTAL TABLES
-- ============================================================

-- 1. Academic Credentials
CREATE TABLE IF NOT EXISTS public.academic_credentials (
  id                UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID        NOT NULL,
  qualification_type TEXT        NOT NULL,
  field_of_study    TEXT,
  institution       TEXT        NOT NULL,
  completion_year   INT,
  status            TEXT        NOT NULL DEFAULT 'completed',
  document_url      TEXT,
  shareable         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.academic_credentials ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='academic_credentials' AND policyname='Users manage own academic credentials') THEN
    CREATE POLICY "Users manage own academic credentials"
      ON public.academic_credentials FOR ALL
      USING  (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='academic_credentials' AND policyname='Admins manage all academic credentials') THEN
    CREATE POLICY "Admins manage all academic credentials"
      ON public.academic_credentials FOR ALL
      USING  (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_academic_credentials_updated_at ON public.academic_credentials;
CREATE TRIGGER update_academic_credentials_updated_at
  BEFORE UPDATE ON public.academic_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Vendor / International Certifications
CREATE TABLE IF NOT EXISTS public.vendor_credentials (
  id                  UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID        NOT NULL,
  certification_name  TEXT        NOT NULL,
  vendor              TEXT        NOT NULL,
  credential_id       TEXT,
  issue_date          DATE,
  expiry_date         DATE,
  document_url        TEXT,
  shareable           BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vendor_credentials ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendor_credentials' AND policyname='Users manage own vendor credentials') THEN
    CREATE POLICY "Users manage own vendor credentials"
      ON public.vendor_credentials FOR ALL
      USING  (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendor_credentials' AND policyname='Admins manage all vendor credentials') THEN
    CREATE POLICY "Admins manage all vendor credentials"
      ON public.vendor_credentials FOR ALL
      USING  (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_vendor_credentials_updated_at ON public.vendor_credentials;
CREATE TRIGGER update_vendor_credentials_updated_at
  BEFORE UPDATE ON public.vendor_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Credential Sharing Requests
CREATE TABLE IF NOT EXISTS public.sharing_requests (
  id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id     UUID        NOT NULL,
  practitioner_id  UUID        NOT NULL,
  message          TEXT        NOT NULL,
  requested_types  JSONB       NOT NULL DEFAULT '[]'::jsonb,
  status           TEXT        NOT NULL DEFAULT 'pending',
  approved_at      TIMESTAMPTZ,
  access_expiry    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sharing_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='sharing_requests' AND policyname='Requester creates sharing request') THEN
    CREATE POLICY "Requester creates sharing request"
      ON public.sharing_requests FOR INSERT
      WITH CHECK (auth.uid() = requester_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='sharing_requests' AND policyname='Requester views own requests') THEN
    CREATE POLICY "Requester views own requests"
      ON public.sharing_requests FOR SELECT
      USING (auth.uid() = requester_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='sharing_requests' AND policyname='Practitioner views own received requests') THEN
    CREATE POLICY "Practitioner views own received requests"
      ON public.sharing_requests FOR SELECT
      USING (auth.uid() = practitioner_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='sharing_requests' AND policyname='Practitioner updates received requests') THEN
    CREATE POLICY "Practitioner updates received requests"
      ON public.sharing_requests FOR UPDATE
      USING (auth.uid() = practitioner_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='sharing_requests' AND policyname='Admins manage sharing requests') THEN
    CREATE POLICY "Admins manage sharing requests"
      ON public.sharing_requests FOR ALL
      USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_sharing_requests_updated_at ON public.sharing_requests;
CREATE TRIGGER update_sharing_requests_updated_at
  BEFORE UPDATE ON public.sharing_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Shared Access tokens
CREATE TABLE IF NOT EXISTS public.shared_access (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id    UUID        NOT NULL REFERENCES public.sharing_requests(id) ON DELETE CASCADE,
  access_token  TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  document_urls JSONB       NOT NULL DEFAULT '[]'::jsonb,
  expiry        TIMESTAMPTZ NOT NULL,
  watermark     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shared_access ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='shared_access' AND policyname='Practitioner creates shared access') THEN
    CREATE POLICY "Practitioner creates shared access"
      ON public.shared_access FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.sharing_requests sr
          WHERE sr.id = request_id AND sr.practitioner_id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='shared_access' AND policyname='Requester views own shared access') THEN
    CREATE POLICY "Requester views own shared access"
      ON public.shared_access FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.sharing_requests sr
          WHERE sr.id = request_id AND (sr.requester_id = auth.uid() OR sr.practitioner_id = auth.uid())
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='shared_access' AND policyname='Admins manage shared access') THEN
    CREATE POLICY "Admins manage shared access"
      ON public.shared_access FOR ALL
      USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- 5. Access Logs
CREATE TABLE IF NOT EXISTS public.access_logs (
  id           UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  access_token TEXT        NOT NULL,
  viewer_id    UUID,
  action       TEXT        NOT NULL DEFAULT 'view',
  metadata     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='access_logs' AND policyname='Anyone can insert access log') THEN
    CREATE POLICY "Anyone can insert access log"
      ON public.access_logs FOR INSERT
      WITH CHECK (TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='access_logs' AND policyname='Practitioner views access logs for own tokens') THEN
    CREATE POLICY "Practitioner views access logs for own tokens"
      ON public.access_logs FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.shared_access sa
          JOIN public.sharing_requests sr ON sr.id = sa.request_id
          WHERE sa.access_token = access_logs.access_token
            AND sr.practitioner_id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='access_logs' AND policyname='Admins view all access logs') THEN
    CREATE POLICY "Admins view all access logs"
      ON public.access_logs FOR SELECT
      USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- 6. In-App Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL,
  type       TEXT        NOT NULL,
  title      TEXT        NOT NULL,
  body       TEXT,
  data       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Users view own notifications') THEN
    CREATE POLICY "Users view own notifications"
      ON public.notifications FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Users update own notifications') THEN
    CREATE POLICY "Users update own notifications"
      ON public.notifications FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Service inserts notifications') THEN
    CREATE POLICY "Service inserts notifications"
      ON public.notifications FOR INSERT
      WITH CHECK (TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Admins manage all notifications') THEN
    CREATE POLICY "Admins manage all notifications"
      ON public.notifications FOR ALL
      USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- 7. Add shareable flag to existing practitioner_accreditations
ALTER TABLE public.practitioner_accreditations
  ADD COLUMN IF NOT EXISTS shareable BOOLEAN NOT NULL DEFAULT TRUE;

-- 8. Sharing settings stored in profiles (add column)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sharing_settings JSONB NOT NULL DEFAULT '{
    "allow_requests": true,
    "default_approval": "manual",
    "default_access_days": 30,
    "default_watermark": true
  }'::jsonb;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sharing_requests;
