-- Fix RLS so admins/NGOs can hide/unhide donations from the Admin Dashboard
-- and ensure UPDATE passes WITH CHECK. Also allow admins/NGOs to read hidden donations.
-- This migration is idempotent: it drops/recreates policies guarded by existence checks.

-- 1) Donations: allow admins/NGOs to read ALL donations (including hidden)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'donations'
      AND policyname = 'Admins/NGOs can read all donations'
  ) THEN
    CREATE POLICY "Admins/NGOs can read all donations"
      ON public.donations FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role IN ('ngo','admin')
        )
      );
  END IF;
END
$$;

-- 2) Donations: ensure donors can update their own rows and pass WITH CHECK
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'donations'
      AND policyname = 'Donors can update their own donations'
  ) THEN
    DROP POLICY "Donors can update their own donations" ON public.donations;
  END IF;

  CREATE POLICY "Donors can update their own donations"
    ON public.donations FOR UPDATE
    USING (auth.uid() = donor_id)
    WITH CHECK (auth.uid() = donor_id);
END
$$;

-- 3) Donations: allow NGOs/admins to perform UPDATEs (e.g., hide/unhide) and pass WITH CHECK
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'donations'
      AND policyname = 'NGOs and admins can hide donations'
  ) THEN
    DROP POLICY "NGOs and admins can hide donations" ON public.donations;
  END IF;

  CREATE POLICY "NGOs and admins can manage donations"
    ON public.donations FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('ngo','admin')
      )
    )
    -- Admin/NGO updates should always pass check; they moderate fields like is_hidden/status
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('ngo','admin')
      )
    );
END
$$;
