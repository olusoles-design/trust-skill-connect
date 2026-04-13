
-- =====================================================================
-- AUDIT LOG SYSTEM
-- Immutable log of every create, read, update, delete, and view action
-- across all platform entities
-- =====================================================================

CREATE TABLE public.audit_logs (
  id            UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id      UUID    NOT NULL,
  actor_role    TEXT    NOT NULL,
  action        TEXT    NOT NULL,
  entity_type   TEXT    NOT NULL,
  entity_id     TEXT    NOT NULL,
  entity_label  TEXT,
  before_data   JSONB,
  after_data    JSONB,
  metadata      JSONB   NOT NULL DEFAULT '{}'::JSONB,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Actors insert own audit logs"
  ON public.audit_logs FOR INSERT TO public
  WITH CHECK (auth.uid() = actor_id);

CREATE POLICY "Admins read all audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "SETA reads audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'seta'::app_role));

CREATE POLICY "Government reads audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'government'::app_role));

CREATE POLICY "Users read own audit trail"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (auth.uid() = actor_id);

CREATE INDEX idx_audit_logs_actor_id    ON public.audit_logs (actor_id);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs (entity_type);
CREATE INDEX idx_audit_logs_entity_id   ON public.audit_logs (entity_id);
CREATE INDEX idx_audit_logs_action      ON public.audit_logs (action);
CREATE INDEX idx_audit_logs_created_at  ON public.audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_entity      ON public.audit_logs (entity_type, entity_id, created_at DESC);
