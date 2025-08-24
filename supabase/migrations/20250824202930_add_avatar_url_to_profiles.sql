-- Add avatar_url to public.profiles to store a public URL of the avatar image
-- This column is nullable; users may not upload an avatar.
alter table public.profiles
add column if not exists avatar_url text;
