
-- Create practitioner_accreditations table
CREATE TABLE public.practitioner_accreditations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  seta_body TEXT NOT NULL,
  role_type TEXT NOT NULL,
  registration_number TEXT,
  id_number TEXT,
  valid_from DATE,
  valid_to DATE,
  status TEXT NOT NULL DEFAULT 'active',
  document_url TEXT,
  raw_extracted JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.practitioner_accreditations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own accreditations" ON public.practitioner_accreditations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own accreditations" ON public.practitioner_accreditations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own accreditations" ON public.practitioner_accreditations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own accreditations" ON public.practitioner_accreditations FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all accreditations" ON public.practitioner_accreditations FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_practitioner_accreditations_updated_at
  BEFORE UPDATE ON public.practitioner_accreditations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create accreditation_qualifications table
CREATE TABLE public.accreditation_qualifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  accreditation_id UUID NOT NULL REFERENCES public.practitioner_accreditations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  saqa_id TEXT,
  title TEXT NOT NULL,
  nqf_level TEXT,
  credits INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.accreditation_qualifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own qualifications" ON public.accreditation_qualifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own qualifications" ON public.accreditation_qualifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own qualifications" ON public.accreditation_qualifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage qualifications" ON public.accreditation_qualifications FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
