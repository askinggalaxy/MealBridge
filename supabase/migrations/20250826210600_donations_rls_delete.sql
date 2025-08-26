-- Allow donors to delete their own donations and NGOs/admins to delete any donation
-- Idempotent: safely drops existing conflicting policies and recreates them.

-- Donors can delete own donations
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'donations'
      AND policyname = 'Donors can delete their own donations'
  ) THEN
    DROP POLICY "Donors can delete their own donations" ON public.donations;
  END IF;

  CREATE POLICY "Donors can delete their own donations"
    ON public.donations FOR DELETE
    USING (auth.uid() = donor_id);
END
$$;

-- NGOs/Admins can delete any donation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'donations'
      AND policyname = 'NGOs and admins can delete donations'
  ) THEN
    DROP POLICY "NGOs and admins can delete donations" ON public.donations;
  END IF;

  CREATE POLICY "NGOs and admins can delete donations"
    ON public.donations FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('ngo','admin')
      )
    );
END
$$;
