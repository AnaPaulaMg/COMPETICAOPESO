create table if not exists public.weekly_weights (
  week_date date primary key,
  ana numeric(6, 2) not null check (ana between 20 and 500),
  luis numeric(6, 2) not null check (luis between 20 and 500),
  sabrina numeric(6, 2) not null check (sabrina between 20 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.site_admins (
  email text primary key
);

alter table public.weekly_weights enable row level security;
alter table public.site_admins enable row level security;

revoke all on public.site_admins from anon, authenticated;
grant select on public.weekly_weights to anon, authenticated;
grant insert, update, delete on public.weekly_weights to authenticated;

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.site_admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to anon, authenticated;

drop policy if exists "Anyone can view weekly weights" on public.weekly_weights;
create policy "Anyone can view weekly weights"
  on public.weekly_weights for select
  to anon, authenticated
  using (true);

drop policy if exists "Only admins can add weekly weights" on public.weekly_weights;
create policy "Only admins can add weekly weights"
  on public.weekly_weights for insert
  to authenticated
  with check (public.is_site_admin());

drop policy if exists "Only admins can update weekly weights" on public.weekly_weights;
create policy "Only admins can update weekly weights"
  on public.weekly_weights for update
  to authenticated
  using (public.is_site_admin())
  with check (public.is_site_admin());

drop policy if exists "Only admins can delete weekly weights" on public.weekly_weights;
create policy "Only admins can delete weekly weights"
  on public.weekly_weights for delete
  to authenticated
  using (public.is_site_admin());
