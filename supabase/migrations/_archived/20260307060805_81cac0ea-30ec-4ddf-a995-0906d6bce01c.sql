
-- ─── task_submissions ────────────────────────────────────────────────────────
CREATE TABLE public.task_submissions (
  id              UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id         UUID NOT NULL REFERENCES public.micro_tasks(id) ON DELETE CASCADE,
  worker_id       UUID NOT NULL,
  status          TEXT NOT NULL DEFAULT 'in_progress'
                    CHECK (status IN ('in_progress','submitted','approved','rejected','disputed')),
  started_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  submitted_at    TIMESTAMP WITH TIME ZONE,
  reviewed_at     TIMESTAMP WITH TIME ZONE,
  proof_text      TEXT,
  proof_url       TEXT,
  timer_seconds   INTEGER NOT NULL DEFAULT 0,
  quality_score   SMALLINT CHECK (quality_score BETWEEN 1 AND 5),
  reviewer_note   TEXT,
  earnings        NUMERIC(10,2),
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (task_id, worker_id)
);

ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Worker views own submissions"
  ON public.task_submissions FOR SELECT
  USING (auth.uid() = worker_id);

CREATE POLICY "Worker inserts own submission"
  ON public.task_submissions FOR INSERT
  WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Worker updates in_progress submission"
  ON public.task_submissions FOR UPDATE
  USING (auth.uid() = worker_id);

CREATE POLICY "Poster views submissions on own tasks"
  ON public.task_submissions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.micro_tasks t
    WHERE t.id = task_submissions.task_id AND t.posted_by = auth.uid()
  ));

CREATE POLICY "Poster reviews submissions on own tasks"
  ON public.task_submissions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.micro_tasks t
    WHERE t.id = task_submissions.task_id AND t.posted_by = auth.uid()
  ));

CREATE TRIGGER update_task_submissions_updated_at
  BEFORE UPDATE ON public.task_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── task_ratings ─────────────────────────────────────────────────────────────
CREATE TABLE public.task_ratings (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id     UUID NOT NULL REFERENCES public.micro_tasks(id) ON DELETE CASCADE,
  rater_id    UUID NOT NULL,
  ratee_id    UUID NOT NULL,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  role        TEXT NOT NULL CHECK (role IN ('worker_rates_poster','poster_rates_worker')),
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (task_id, rater_id, role)
);

ALTER TABLE public.task_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views task ratings"
  ON public.task_ratings FOR SELECT USING (true);

CREATE POLICY "Authenticated users create ratings"
  ON public.task_ratings FOR INSERT
  WITH CHECK (auth.uid() = rater_id);

-- ─── Enable realtime for live submission updates ──────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_submissions;

-- ─── Add extra columns to micro_tasks ────────────────────────────────────────
ALTER TABLE public.micro_tasks
  ADD COLUMN IF NOT EXISTS accepted_by UUID,
  ADD COLUMN IF NOT EXISTS escrow_held NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS max_workers INTEGER NOT NULL DEFAULT 1;
