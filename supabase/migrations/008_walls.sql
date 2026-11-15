-- Walls: murals within 20 m of each other (chained) are grouped under one wall. Data only; no UI yet.
-- Murals are never merged/deleted (comments, votes and URLs stay); they just share a wall_id.
create table if not exists walls (
  id         uuid primary key default gen_random_uuid(),
  name       text,                       -- defaults to the oldest member's location description; editable
  created_at timestamptz not null default now()
);
alter table walls enable row level security;
drop policy if exists "walls_public_read" on walls;
drop policy if exists "walls_admin_write" on walls;
create policy "walls_public_read" on walls for select using (true);
create policy "walls_admin_write" on walls for all to authenticated using (is_admin()) with check (is_admin());

alter table murals
  add column if not exists wall_id uuid references walls(id) on delete set null,
  add column if not exists changes_often boolean not null default false;  -- location where the painting is replaced regularly
create index if not exists murals_wall_idx on murals (wall_id);

create or replace function metres_between(lat1 float8, lng1 float8, lat2 float8, lng2 float8) returns float8
language sql immutable as $$
  select 2 * 6371000 * asin(sqrt(power(sin(radians(lat2 - lat1) / 2), 2)
       + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)))
$$;

-- Recompute wall groups from coordinates. Existing wall ids are kept when a group already had one.
create or replace function recompute_walls(radius_m float8 default 20) returns void
language plpgsql security definer set search_path = public as $$
declare changed int;
begin
  create temp table if not exists _wl (id uuid primary key, lat float8, lng float8, label text) on commit drop;
  create temp table if not exists _wc (label text primary key, wall uuid) on commit drop;
  truncate _wl; truncate _wc;

  insert into _wl
    select id, (coordinates->>'lat')::float8, (coordinates->>'lng')::float8, id::text
    from murals where coordinates ? 'lat' and coordinates ? 'lng';

  -- connected components (single linkage) by label propagation
  loop
    update _wl a set label = n.l
    from (select a2.id, min(b.label) l from _wl a2
          join _wl b on b.id <> a2.id and metres_between(a2.lat, a2.lng, b.lat, b.lng) <= radius_m
          group by a2.id) n
    where n.id = a.id and n.l < a.label;
    get diagnostics changed = row_count;
    exit when changed = 0;
  end loop;

  -- groups of 2+ murals; reuse an existing wall id if any member had one
  insert into _wc
    select l.label, (select min(m.wall_id::text)::uuid from murals m join _wl l2 on l2.id = m.id
                     where l2.label = l.label and m.wall_id is not null)
    from _wl l group by l.label having count(*) >= 2;
  -- a wall id may only belong to one group
  update _wc set wall = null
   where wall is not null and label not in (select min(label) from _wc where wall is not null group by wall);
  update _wc set wall = gen_random_uuid() where wall is null;

  insert into walls (id, name)
    select c.wall, (select m.location_description from murals m join _wl l on l.id = m.id
                    where l.label = c.label order by m.created_at limit 1)
    from _wc c where not exists (select 1 from walls w where w.id = c.wall);

  update murals m set wall_id = c.wall
    from _wl l join _wc c on c.label = l.label
    where l.id = m.id and m.wall_id is distinct from c.wall;
  update murals set wall_id = null
    where wall_id is not null and id not in (select l.id from _wl l join _wc c on c.label = l.label);
  delete from walls w where not exists (select 1 from murals m where m.wall_id = w.id);
end $$;

create or replace function murals_walls_trg() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform recompute_walls();
  return null;
end $$;
drop trigger if exists murals_walls on murals;
create trigger murals_walls after insert or update of coordinates on murals
  for each statement execute function murals_walls_trg();

select recompute_walls();

-- Locations that look like they get repainted regularly (seasonal / year-stamped themes).
update murals set changes_often = true where slug in ('dia-de-muertos-2025', 'dia-de-muertos-school');
