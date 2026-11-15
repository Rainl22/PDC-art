-- Artist directory: reuse an artist's Instagram/link every time they're tagged. Applied via the SQL tool.
create table if not exists artists (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  instagram  text,
  url        text,
  created_at timestamptz not null default now()
);
create unique index if not exists artists_name_key on artists (lower(name));
alter table artists enable row level security;
create policy "artists_public_read" on artists for select using (true);
create policy "artists_admin_write" on artists for all to authenticated using (is_admin()) with check (is_admin());

insert into artists (name, instagram)
select distinct on (lower(a->>'name')) a->>'name', nullif(a->>'instagram','')
from murals, jsonb_array_elements(coalesce(artists, '[]'::jsonb)) a
where coalesce(a->>'name','') <> ''
order by lower(a->>'name'), (nullif(a->>'instagram','') is null)
on conflict do nothing;
