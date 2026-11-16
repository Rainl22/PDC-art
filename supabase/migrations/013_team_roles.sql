-- Team roles: the first admin is the 'owner' (cannot be removed by anyone); everyone else is a 'moderator'.
-- Both can do day-to-day admin work (is_admin() is true for both). All management goes through these functions;
-- the admins table itself has no policies, so it stays unreadable/unwritable from the public API.
alter table admins add column if not exists role text not null default 'moderator' check (role in ('owner','moderator'));
update admins set role = 'owner' where created_at = (select min(created_at) from admins);

create or replace function my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from admins where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) limit 1
$$;

create or replace function list_team() returns table (email text, role text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select a.email, a.role, a.created_at from admins a where is_admin() order by (a.role = 'owner') desc, a.created_at
$$;

create or replace function add_team_member(p_email text) returns void
language plpgsql security definer set search_path = public as $$
declare e text := lower(btrim(coalesce(p_email, '')));
begin
  if not is_admin() then raise exception 'not_allowed'; end if;
  if length(e) > 200 or e !~ '^[^@ ]+@[^@ ]+[.][^@ ]+$' then raise exception 'bad_email'; end if;
  insert into admins (email, role) values (e, 'moderator') on conflict (email) do nothing;
end $$;

create or replace function remove_team_member(p_email text) returns void
language plpgsql security definer set search_path = public as $$
declare e text := lower(btrim(coalesce(p_email, ''))); r text;
begin
  if not is_admin() then raise exception 'not_allowed'; end if;
  select role into r from admins where lower(email) = e;
  if r is null then return; end if;
  if r = 'owner' then raise exception 'cannot_remove_owner'; end if;
  delete from admins where lower(email) = e;
end $$;

revoke all on function my_role() from public;
revoke all on function list_team() from public;
revoke all on function add_team_member(text) from public;
revoke all on function remove_team_member(text) from public;
grant execute on function my_role() to authenticated;
grant execute on function list_team() to authenticated;
grant execute on function add_team_member(text) to authenticated;
grant execute on function remove_team_member(text) to authenticated;

-- A repainted mural can be renamed: the old name stays with the old photos here.
alter table murals add column if not exists artwork_history jsonb not null default '[]'::jsonb;
