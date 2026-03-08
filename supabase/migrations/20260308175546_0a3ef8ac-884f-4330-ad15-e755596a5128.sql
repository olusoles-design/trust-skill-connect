
-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Anyone views available micro_tasks" ON public.micro_tasks;

-- Only learners can browse available tasks on the Gig Board
CREATE POLICY "Learners browse available tasks"
  ON public.micro_tasks FOR SELECT TO authenticated
  USING (status = 'active' OR (status = 'available' AND has_role(auth.uid(), 'learner'::app_role)));

-- Task poster can always see their own tasks (any status)
CREATE POLICY "Poster views own tasks"
  ON public.micro_tasks FOR SELECT TO authenticated
  USING (auth.uid() = posted_by);

-- Admins see all tasks
CREATE POLICY "Admins view all micro_tasks"
  ON public.micro_tasks FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
