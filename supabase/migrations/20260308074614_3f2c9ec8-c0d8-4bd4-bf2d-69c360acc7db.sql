
-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: regulatory_bodies
-- Dynamic registry of all statutory and voluntary bodies governing
-- skills development, qualifications, and compliance in South Africa.
-- Replaces all hard-coded SETA references throughout the platform.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.regulatory_bodies (
  id                UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  acronym           TEXT    NOT NULL UNIQUE,
  full_name         TEXT    NOT NULL,
  body_type         TEXT    NOT NULL CHECK (body_type IN ('seta','qcto','saqa','professional_body','other')),
  sector            TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  is_levy_funded    BOOLEAN NOT NULL DEFAULT false,
  reporting_formats JSONB   NOT NULL DEFAULT '[]'::jsonb,
  doc_rules         JSONB   NOT NULL DEFAULT '[]'::jsonb,
  website_url       TEXT,
  notes             TEXT,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TRIGGER update_regulatory_bodies_updated_at
  BEFORE UPDATE ON public.regulatory_bodies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.regulatory_bodies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active regulatory bodies"
  ON public.regulatory_bodies FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage regulatory bodies"
  ON public.regulatory_bodies FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_reg_bodies_type   ON public.regulatory_bodies (body_type);
CREATE INDEX idx_reg_bodies_active ON public.regulatory_bodies (is_active);

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED DATA
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.regulatory_bodies
  (acronym, full_name, body_type, sector, is_levy_funded, reporting_formats, doc_rules, website_url, sort_order)
VALUES
  -- Quality Councils
  ('SAQA',         'South African Qualifications Authority',                                              'saqa',            NULL,                                          false, '["NQF Registration"]',                        '["NQF Cert","ID Copy"]',                                             'https://www.saqa.org.za',   1),
  ('QCTO',         'Quality Council for Trades and Occupations',                                         'qcto',            'Trades & Occupations',                        false, '["OFO Report","Occupational Qualification"]',  '["Accreditation Letter","OFO Code Sheet"]',                          'https://www.qcto.org.za',   2),
  ('CHE',          'Council on Higher Education',                                                        'other',           'Higher Education',                            false, '["Programme Accreditation Report"]',           '["HEQF Certificate"]',                                               'https://www.che.ac.za',     3),
  ('Umalusi',      'Council for Quality Assurance in General and FET',                                   'other',           'General & FET',                               false, '["GENFETQA Report"]',                          '["Matric Certificate"]',                                             'https://www.umalusi.org.za',4),

  -- SETAs
  ('AgriSETA',     'Agriculture Sector Education and Training Authority',                                'seta', 'Agriculture, Land Reform & Environment',       true, '["WSP","ATR","Pivotal","DSD"]', '["Tax Clearance","BEE Affidavit","Accreditation Cert"]',                   'https://www.agriseta.co.za',   10),
  ('BANKSETA',     'Banking Sector Education and Training Authority',                                    'seta', 'Banking',                                      true, '["WSP","ATR","Pivotal","DSD"]', '["Tax Clearance","BEE Affidavit","Accreditation Cert"]',                   'https://www.bankseta.org.za',  11),
  ('CATHSSETA',    'Culture, Arts, Tourism, Hospitality and Sport SETA',                                'seta', 'Culture, Arts, Tourism, Hospitality & Sport',  true, '["WSP","ATR","Pivotal","DSD"]', '["Tax Clearance","BEE Affidavit","Accreditation Cert"]',                   'https://www.cathsseta.org.za', 12),
  ('CHIETA',       'Chemical Industries Education and Training Authority',                               'seta', 'Chemical Industries',                          true, '["WSP","ATR","Pivotal","DSD"]', '["Tax Clearance","BEE Affidavit","Accreditation Cert"]',                   'https://www.chieta.org.za',    13),
  ('CETA',         'Construction Education and Training Authority',                                      'seta', 'Construction',                                 true, '["WSP","ATR","Pivotal","DSD"]', '["Tax Clearance","BEE Affidavit","Accreditation Cert"]',                   'https://www.ceta.org.za',      14),
  ('ETDP SETA',    'Education, Training and Development Practices SETA',                                'seta', 'Education, Training & Development',            true, '["WSP","ATR","Pivotal","DSD"]', '["Tax Clearance","BEE Affidavit","Accreditation Cert","Practitioner Reg"]', 'https://www.etdpseta.org.za',  15),
  ('EWSETA',       'Energy and Water Sector Education and Training Authority',                           'seta', 'Energy & Water',                               true, '["WSP","ATR","Pivotal","DSD"]', '["Tax Clearance","BEE Affidavit","Accreditation Cert"]',                   'https://www.ewseta.org.za',    16),
  ('FASSET',       'Financial and Accounting Services Sector Education and Training Authority',          'seta', 'Finance, Accounting & Management Consulting',  true, '["WSP","ATR","Pivotal","DSD"]', '["Tax Clearance","BEE Affidavit","Accreditation Cert"]',                   'https://www.fasset.org.za',    17),
  ('FIETA',        'Fibre Processing and Manufacturing SETA',                                           'seta', 'Fibre, Textile, Clothing, Leather & Footwear', true, '["WSP","ATR","Pivotal","DSD"]', '["Tax Clearance","BEE Affidavit","Accreditation Cert"]',                   'https://www.fieta.org.za',     18),
  ('FOODBEV',      'Food and Beverages Manufacturing Industry SETA',                                    'seta', 'Food & Beverages',                             true, '["WSP","ATR","Pivotal","DSD"]', '["Tax Clearance","BEE Affidavit","Accreditation Cert"]',                   'https://www.foodbev.co.za',    19),
  ('HWSETA',       'Health and Welfare Sector Education and Training Authority',                         'seta', 'Health & Social Development',                  true, '["WSP","ATR","Pivotal","DSD"]', '["Tax Clearance","BEE Affidavit","Accreditation Cert"]',                   'https://www.hwseta.org.za',    20),
  ('INSETA',       'Insurance Sector Education and Training Authority',                                  'seta', 'Insurance',                                    true, '["WSP","ATR","Pivotal","DSD"]', '["Tax Clearance","BEE Affidavit","Accreditation Cert"]',                   'https://www.inseta.org.za',    21),
  ('LGSETA',       'Local Government Sector Education and Training Authority',                           'seta', 'Local Government',                             true, '["WSP","ATR","Pivotal","DSD"]', '["Tax Clearance","BEE Affidavit","Accreditation Cert"]',                   'https://www.lgseta.org.za',    22),
  ('MERSETA',      'Manufacturing, Engineering and Related Services SETA',                               'seta', 'Manufacturing, Engineering & Related Services', true, '["WSP","ATR","Pivotal","DSD"]', '["Tax Clearance","BEE Affidavit","Accreditation Cert","Practitioner Reg"]', 'https://www.merseta.org.za',  23),
  ('MICT SETA',    'Media, Information and Communication Technologies SETA',                             'seta', 'Media, Information & Communication Technology', true, '["WSP","ATR","Pivotal","DSD"]', '["Tax Clearance","BEE Affidavit","Accreditation Cert","Practitioner Reg"]', 'https://www.mict.org.za',     24),
  ('MQA',          'Mining Qualifications Authority',                                                    'seta', 'Mining & Minerals',                            true, '["WSP","ATR","Pivotal","DSD"]', '["Tax Clearance","BEE Affidavit","Accreditation Cert"]',                   'https://www.mqa.org.za',       25),
  ('PSETA',        'Public Service Sector Education and Training Authority',                             'seta', 'Public Service',                               true, '["WSP","ATR","Pivotal","DSD"]', '["Tax Clearance","BEE Affidavit","Accreditation Cert"]',                   'https://www.pseta.org.za',     26),
  ('SASSETA',      'Safety and Security Sector Education and Training Authority',                        'seta', 'Safety & Security',                            true, '["WSP","ATR","Pivotal","DSD"]', '["Tax Clearance","BEE Affidavit","Accreditation Cert"]',                   'https://www.sasseta.org.za',   27),
  ('Services SETA','Services Sector Education and Training Authority',                                   'seta', 'Services',                                     true, '["WSP","ATR","Pivotal","DSD"]', '["Tax Clearance","BEE Affidavit","Accreditation Cert"]',                   'https://www.serviceseta.org.za',28),
  ('TETA',         'Transport Education and Training Authority',                                         'seta', 'Transport',                                    true, '["WSP","ATR","Pivotal","DSD"]', '["Tax Clearance","BEE Affidavit","Accreditation Cert"]',                   'https://www.teta.org.za',      29),
  ('W&RSETA',      'Wholesale and Retail Sector Education and Training Authority',                       'seta', 'Wholesale & Retail',                           true, '["WSP","ATR","Pivotal","DSD"]', '["Tax Clearance","BEE Affidavit","Accreditation Cert"]',                   'https://www.wrseta.org.za',    30),

  -- Professional Bodies
  ('SABPP',  'South African Board for People Practices',                'professional_body', 'Human Resources & People Development', false, '["CPD Report","Membership Renewal"]',           '["SABPP Membership Card","CPD Portfolio"]',  'https://www.sabpp.co.za',   40),
  ('ECSA',   'Engineering Council of South Africa',                     'professional_body', 'Engineering',                          false, '["CPD Report","Professional Review"]',          '["ECSA Registration","Engineering Degree"]', 'https://www.ecsa.co.za',    41),
  ('HPCSA',  'Health Professions Council of South Africa',              'professional_body', 'Health',                               false, '["Annual Registration","CPD Report"]',          '["HPCSA Certificate","Medical Degree"]',     'https://www.hpcsa.co.za',   42),
  ('SAIT',   'South African Institute of Tax Professionals',            'professional_body', 'Tax & Accounting',                     false, '["CPD Report","Tax Practitioner Registration"]','["SAIT Membership","Tax Qualification"]',    'https://www.thesait.org.za',43),
  ('SAICA',  'South African Institute of Chartered Accountants',        'professional_body', 'Accounting & Auditing',                false, '["CPD Report","APC Preparation"]',              '["SAICA Membership","CA(SA) Certificate"]',  'https://www.saica.co.za',   44);
