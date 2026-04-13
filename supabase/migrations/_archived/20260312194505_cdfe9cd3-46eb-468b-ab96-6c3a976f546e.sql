
-- Enable realtime for audit_logs (INSERT only — immutable table)
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
