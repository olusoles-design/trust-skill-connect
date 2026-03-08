
-- Allow authenticated users to view active practitioner accreditations (for directory)
CREATE POLICY "Authenticated users view active accreditations"
ON public.practitioner_accreditations
FOR SELECT
TO authenticated
USING (status = 'active');

-- Allow authenticated users to view all profiles (for practitioner directory)
CREATE POLICY "Authenticated users view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);
