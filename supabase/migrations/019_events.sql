-- 019: first-party visitor analytics (applied via the Supabase tool; this file is the record).
-- Anonymous, no IP stored. One row per page view or action. Country/device are derived server-side in /api/e.

create table if not exists public.events (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  visitor_id text not null check (length(visitor_id) between 8 and 64),   -- random id kept on the device, not tied to a person
  name       text not null check (name in ('page_view','explore_map_click','how_it_works_click','install_click','app_installed','tour_started','favourite_saved')),
  path       text check (length(path) <= 200),
  source     text not null default 'direct' check (source ~ '^[a-z0-9._-]{1,60}$'),
  country    text check (length(country) = 2),
  device     text check (device in ('mobile','tablet','desktop','other')),
  os         text check (length(os) <= 30),
  browser    text check (length(browser) <= 30)
);

create index if not exists events_created_idx on public.events (created_at);
create index if not exists events_visitor_idx on public.events (visitor_id, created_at);

alter table public.events enable row level security;

-- Anyone can add an event; only team members can read them.
drop policy if exists events_insert on public.events;
create policy events_insert on public.events for insert to anon, authenticated with check (true);
drop policy if exists events_admin_read on public.events;
create policy events_admin_read on public.events for select to authenticated using (public.is_admin());

-- Spam guard: at most 300 events per visitor per hour.
create or replace function public.events_rate_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.events where visitor_id = new.visitor_id and created_at > now() - interval '1 hour') >= 300 then
    raise exception 'rate limit';
  end if;
  return new;
end $$;

drop trigger if exists events_rate_limit_trg on public.events;
create trigger events_rate_limit_trg before insert on public.events for each row execute function public.events_rate_limit();

-- Everything the admin Stats tab shows, in one call. Team members only.
create or replace function public.stats_summary(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_since timestamptz := now() - make_interval(days => greatest(1, least(p_days, 365)));
  res jsonb;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  with e as (select * from public.events where created_at >= v_since),
  came_back as (
    select visitor_id from public.events
    where visitor_id in (select visitor_id from e)
    group by visitor_id
    having count(distinct (created_at at time zone 'America/Cancun')::date) >= 2
  )
  select jsonb_build_object(
    'days', greatest(1, least(p_days, 365)),
    'visitors', (select count(distinct visitor_id) from e),
    'returning', (select count(*) from came_back),
    'pageviews', (select count(*) from e where name = 'page_view'),
    'by_day', (select coalesce(jsonb_agg(r order by r.day), '[]'::jsonb) from (
        select (created_at at time zone 'America/Cancun')::date as day, count(distinct visitor_id) as visitors from e group by 1) r),
    'by_source', (select coalesce(jsonb_agg(r order by r.visitors desc), '[]'::jsonb) from (
        select source,
          count(distinct visitor_id) as visitors,
          count(distinct visitor_id) filter (where name = 'page_view' and path in ('/gallery','/map')) as explored,
          count(distinct visitor_id) filter (where name = 'tour_started') as tours,
          count(distinct visitor_id) filter (where name = 'favourite_saved') as favourites,
          count(distinct visitor_id) filter (where name in ('install_click','app_installed')) as installs
        from e group by source) r),
    'by_country', (select coalesce(jsonb_agg(r order by r.visitors desc), '[]'::jsonb) from (
        select coalesce(country, '??') as country, count(distinct visitor_id) as visitors from e group by 1 order by 2 desc limit 15) r),
    'by_device', (select coalesce(jsonb_agg(r order by r.visitors desc), '[]'::jsonb) from (
        select coalesce(device, 'other') as device, count(distinct visitor_id) as visitors from e group by 1) r),
    'by_os', (select coalesce(jsonb_agg(r order by r.visitors desc), '[]'::jsonb) from (
        select coalesce(os, 'other') as os, count(distinct visitor_id) as visitors from e group by 1 order by 2 desc limit 8) r),
    'by_page', (select coalesce(jsonb_agg(r order by r.views desc), '[]'::jsonb) from (
        select path, count(*) as views, count(distinct visitor_id) as visitors from e where name = 'page_view' group by path order by 2 desc limit 15) r),
    'actions', (select coalesce(jsonb_agg(r order by r.events desc), '[]'::jsonb) from (
        select name, count(*) as events, count(distinct visitor_id) as visitors from e where name <> 'page_view' group by name) r)
  ) into res;
  return res;
end $$;

revoke all on function public.stats_summary(int) from public, anon;
grant execute on function public.stats_summary(int) to authenticated;
