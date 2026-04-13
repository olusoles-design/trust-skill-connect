
CREATE TABLE public.document_vault (
  id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid        NOT NULL,
  doc_type        text        NOT NULL,
  label           text        NOT NULL,
  file_url        text        NOT NULL,
  file_name       text        NOT NULL,
  file_size       bigint,
  mime_type       text,
  status          text        NOT NULL DEFAULT 'pending',
  expires_at      date,
  reviewer_note   text,
  reviewed_by     uuid,
  reviewed_at     timestamp with time zone,
  created_at      timestamp with time zone NOT NULL DEFAULT now(),
  updated_at      timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_document_vault_user_id   ON public.document_vault (user_id);
CREATE INDEX idx_document_vault_status    ON public.document_vault (status);
CREATE INDEX idx_document_vault_expires   ON public.document_vault (expires_at);

ALTER TABLE public.document_vault ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own documents"
  ON public.document_vault FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own documents"
  ON public.document_vault FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own pending documents"
  ON public.document_vault FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins view all documents"
  ON public.document_vault FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'seta'));

CREATE POLICY "Admins update document status"
  ON public.document_vault FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'seta'));

CREATE TRIGGER update_document_vault_updated_at
  BEFORE UPDATE ON public.document_vault
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
