
-- Expand app_role enum with 5 new roles (admin, seta, government, fundi, employer)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'seta';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'government';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'fundi';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'employer';
