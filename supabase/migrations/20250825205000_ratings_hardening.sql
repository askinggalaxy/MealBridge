-- Strengthen ratings model and RLS for donor <-> recipient reviews
-- This migration is idempotent: safely checks for existing objects before creating them.

-- 1) Ensure ratings table exists (created in earlier migration). Add a safety CHECK: rater_id <> rated_id
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'ratings'
  ) then
    -- Add a named CHECK constraint if missing
    if not exists (
      select 1
      from information_schema.table_constraints
      where constraint_schema = 'public'
        and table_name = 'ratings'
        and constraint_name = 'ratings_rater_not_rated_chk'
    ) then
      alter table public.ratings
      add constraint ratings_rater_not_rated_chk
      check (rater_id <> rated_id);
    end if;
  end if;
end
$$;

-- 2) Helpful indexes (no-ops if already exist)
create index if not exists idx_ratings_rated_id on public.ratings (rated_id);
create index if not exists idx_ratings_donation on public.ratings (donation_id);

-- 3) Tighten RLS policies on ratings
-- Drop old INSERT policy (if it exists) to avoid duplicates in policy names
do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ratings'
      and policyname = 'Users can create ratings for completed donations'
  ) then
    drop policy "Users can create ratings for completed donations" on public.ratings;
  end if;
end
$$;

-- Ratings are publicly readable (keep or create)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ratings'
      and policyname = 'Ratings are publicly readable'
  ) then
    create policy "Ratings are publicly readable"
      on public.ratings for select
      using (true);
  end if;
end
$$;

-- Allow INSERT only if:
-- - auth.uid() = rater_id
-- - donation has a COMPLETED reservation involving auth.uid()
-- - rated_id este exact cealaltă parte a tranzacției:
--     * dacă rater este DONOR: rated_id este recipientul rezervării completed
--     * dacă rater este RECIPIENT: rated_id este donorul donației
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ratings'
      and policyname = 'Users can insert rating only for their counterpart on completed donation'
  ) then
    create policy "Users can insert rating only for their counterpart on completed donation"
      on public.ratings for insert
      with check (
        auth.uid() = rater_id
        and (
          -- Case A: rater este DONOR -> trebuie să existe reservation COMPLETED,
          -- iar rated_id = recipientul acelei rezervări
          (
            auth.uid() = (select d.donor_id from public.donations d where d.id = ratings.donation_id)
            and exists (
              select 1
              from public.reservations r
              where r.donation_id = ratings.donation_id
                and r.status = 'completed'
                and ratings.rated_id = r.recipient_id
            )
          )
          or
          -- Case B: rater este RECIPIENT -> trebuie să existe reservation COMPLETED
          -- pentru care r.recipient_id = auth.uid(), iar rated_id = donorul donației
          (
            exists (
              select 1
              from public.reservations r
              where r.donation_id = ratings.donation_id
                and r.status = 'completed'
                and r.recipient_id = auth.uid()
            )
            and ratings.rated_id = (
              select d.donor_id from public.donations d where d.id = ratings.donation_id
            )
          )
        )
      );
  end if;
end
$$;

-- Allow UPDATE only to the author, and still enforce valid counterpart relation
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ratings'
      and policyname = 'Users can update their own ratings if counterpart relation holds'
  ) then
    create policy "Users can update their own ratings if counterpart relation holds"
      on public.ratings for update
      using (auth.uid() = rater_id)
      with check (
        auth.uid() = rater_id
        and (
          (
            auth.uid() = (select d.donor_id from public.donations d where d.id = ratings.donation_id)
            and exists (
              select 1
              from public.reservations r
              where r.donation_id = ratings.donation_id
                and r.status = 'completed'
                and ratings.rated_id = r.recipient_id
            )
          )
          or
          (
            exists (
              select 1
              from public.reservations r
              where r.donation_id = ratings.donation_id
                and r.status = 'completed'
                and r.recipient_id = auth.uid()
            )
            and ratings.rated_id = (
              select d.donor_id from public.donations d where d.id = ratings.donation_id
            )
          )
        )
      );
  end if;
end
$$;

-- Allow DELETE only to the author
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ratings'
      and policyname = 'Users can delete their own ratings'
  ) then
    create policy "Users can delete their own ratings"
      on public.ratings for delete
      using (auth.uid() = rater_id);
  end if;
end
$$;

-- 4) Reputation recompute function: handle INSERT/UPDATE/DELETE
-- Note: updates profiles (side effect) => VOLATILE and SECURITY DEFINER. We also lock down search_path.
create or replace function public.recompute_reputation_for(_user_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Recompute for the given user based on all ratings received
  update public.profiles p
     set reputation_score = coalesce((
            select avg(r.rating)::numeric from public.ratings r where r.rated_id = _user_id
          ), 0),
         reputation_count = coalesce((
            select count(*)::integer from public.ratings r where r.rated_id = _user_id
          ), 0),
         updated_at = now()
   where p.id = _user_id;
end;
$$;

-- Wrapper trigger function to call recompute for NEW/OLD rows based on TG_OP
create or replace function public.tg_recompute_reputation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- INSERT/UPDATE: recompute for NEW.rated_id
  if (tg_op = 'INSERT') then
    perform public.recompute_reputation_for(new.rated_id);
    return new;
  elsif (tg_op = 'UPDATE') then
    -- If rated_id changed, recompute both
    if (new.rated_id <> old.rated_id) then
      perform public.recompute_reputation_for(old.rated_id);
    end if;
    perform public.recompute_reputation_for(new.rated_id);
    return new;
  elsif (tg_op = 'DELETE') then
    perform public.recompute_reputation_for(old.rated_id);
    return old;
  end if;

  return null;
end;
$$;

-- Replace older trigger(s) with a unified one
drop trigger if exists on_rating_created on public.ratings;
drop trigger if exists tg_ratings_recompute on public.ratings;

create trigger tg_ratings_recompute
after insert or update or delete on public.ratings
for each row
execute function public.tg_recompute_reputation();
