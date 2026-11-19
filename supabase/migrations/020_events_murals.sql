-- 020: say WHICH mural an event is about, and add map-pin / tour-stop / walk / share events.
-- Additive and backward compatible: old clients keep working, mural_id stays null for them.

alter table public.events add column if not exists mural_id uuid;   -- no FK on purpose: analytics must never block or follow a mural delete
create index if not exists events_mural_idx on public.events (mural_id) where mural_id is not null;

alter table public.events drop constraint if exists events_name_check;
alter table public.events add constraint events_name_check check (name in (
  'page_view','explore_map_click','how_it_works_click','install_click','app_installed','tour_started','favourite_saved',
  'map_pin_click','tour_stop_added','walk_started','tour_shared'));

-- stats_summary: same as 019 plus 'top_murals' (views come from /gallery/<slug> page views; the rest from mural_id events).
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
  ),
  mv as (
    select m.id as mural_id, count(*) as views from e join public.murals m on e.path = '/gallery/' || m.slug
    where e.name = 'page_view' group by m.id
  ),
  ma as (
    select mural_id,
      count(*) filter (where name = 'map_pin_click')   as pins,
      count(*) filter (where name = 'favourite_saved') as favs,
      count(*) filter (where name = 'tour_stop_added') as tour_adds
    from e where mural_id is not null group by mural_id
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
        select name, count(*) as events, count(distinct visitor_id) as visitors from e where name <> 'page_view' group by name) r),
    'top_murals', (select coalesce(jsonb_agg(r order by r.score desc, r.title), '[]'::jsonb) from (
        select m.title, m.slug,
          coalesce(mv.views, 0) as views, coalesce(ma.pins, 0) as pins, coalesce(ma.favs, 0) as favourites, coalesce(ma.tour_adds, 0) as tours,
          coalesce(mv.views, 0) + coalesce(ma.pins, 0) + coalesce(ma.favs, 0) + coalesce(ma.tour_adds, 0) as score
        from public.murals m left join mv on mv.mural_id = m.id left join ma on ma.mural_id = m.id
        where mv.mural_id is not null or ma.mural_id is not null
        order by score desc, m.title limit 20) r)
  ) into res;
  return res;
end $$;

revoke all on function public.stats_summary(int) from public, anon;
grant execute on function public.stats_summary(int) to authenticated;
