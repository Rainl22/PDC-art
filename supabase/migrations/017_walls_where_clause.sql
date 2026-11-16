-- Fix: saving a mural (or approving a submission) that sets its pin failed with
-- "DELETE requires a WHERE clause (21000)". Supabase's API role blocks DELETE/UPDATE without WHERE,
-- and recompute_walls() cleared its two temp tables with bare deletes. Same logic, WHERE added.
create or replace function recompute_walls(radius_m float8 default 20) returns void
language plpgsql security definer set search_path = public as $$
declare changed int;
begin
  create temp table if not exists _wl (id uuid primary key, lat float8, lng float8, label text) on commit drop;
  create temp table if not exists _wc (label text primary key, wall uuid) on commit drop;
  delete from _wl where true;
  delete from _wc where true;

  insert into _wl
    select id, (coordinates->>'lat')::float8, (coordinates->>'lng')::float8, id::text
    from murals where coordinates ? 'lat' and coordinates ? 'lng';

  loop
    update _wl a set label = n.l
    from (select a2.id, min(b.label) l from _wl a2
          join _wl b on b.id <> a2.id and metres_between(a2.lat, a2.lng, b.lat, b.lng) <= radius_m
          group by a2.id) n
    where n.id = a.id and n.l < a.label;
    get diagnostics changed = row_count;
    exit when changed = 0;
  end loop;

  insert into _wc
    select l.label, (select min(m.wall_id::text)::uuid from murals m join _wl l2 on l2.id = m.id
                     where l2.label = l.label and m.wall_id is not null)
    from _wl l group by l.label having count(*) >= 2;
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
