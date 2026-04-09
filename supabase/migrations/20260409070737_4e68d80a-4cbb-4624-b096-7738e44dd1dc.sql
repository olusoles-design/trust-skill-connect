
CREATE TABLE public.practitioner_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  practitioner_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  programme TEXT NOT NULL,
  practitioner_type TEXT NOT NULL DEFAULT 'facilitator',
  start_date DATE,
  end_date DATE,
  total_days INTEGER NOT NULL DEFAULT 1,
  daily_rate NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.practitioner_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own contracts"
ON public.practitioner_contracts FOR ALL
USING (auth.uid() = practitioner_id)
WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Admins manage all contracts"
ON public.practitioner_contracts FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_practitioner_contracts_updated_at
BEFORE UPDATE ON public.practitioner_contracts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
