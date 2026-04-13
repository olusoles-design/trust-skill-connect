
CREATE TABLE public.learner_programmes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  provider TEXT NOT NULL,
  nqf_level INTEGER NOT NULL DEFAULT 1,
  progress_pct INTEGER NOT NULL DEFAULT 0,
  modules_completed INTEGER NOT NULL DEFAULT 0,
  total_modules INTEGER NOT NULL DEFAULT 1,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.learner_programmes ENABLE ROW LEVEL SECURITY;

-- Learners manage own enrolments
CREATE POLICY "Users view own programmes"
  ON public.learner_programmes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own programmes"
  ON public.learner_programmes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own programmes"
  ON public.learner_programmes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own programmes"
  ON public.learner_programmes FOR DELETE
  USING (auth.uid() = user_id);

-- Admins full access
CREATE POLICY "Admins manage all programmes"
  ON public.learner_programmes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Sponsors/employers read-only
CREATE POLICY "Sponsors view programmes"
  ON public.learner_programmes FOR SELECT
  USING (has_role(auth.uid(), 'sponsor'::app_role) OR has_role(auth.uid(), 'employer'::app_role));

-- Auto-update timestamp
CREATE TRIGGER update_learner_programmes_updated_at
  BEFORE UPDATE ON public.learner_programmes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
