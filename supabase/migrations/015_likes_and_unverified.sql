-- "likely" is merged into "unverified" (two pills: Verified / Unverified; Removed stays).
update murals set confidence = 'unverified' where confidence = 'likely';

-- Likes: one per anonymous device (localStorage id), counted on murals.like_count. Applied via the SQL tool.
alter table murals add column if not exists like_count integer not null default 0;
create table if not exists mural_likes (
  mural_id   uuid not null references murals(id) on delete cascade,
  device_id  text not null,
  active     boolean not null default true,
  ip_hash    text,
  updated_at timestamptz not null default now(),
  primary key (mural_id, device_id)
);
alter table mural_likes enable row level security;
revoke all on mural_likes from anon, authenticated;

-- helper (also defined in 006, which has NOT been applied to the database yet)
create or replace function request_ip_hash() returns text
language sql stable set search_path = public as $$
  select case when ip = '' then null else md5('murales-pdc|' || ip) end
  from (select trim(split_part(coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for', ''), ',', 1)) as ip) s
$$;

create or replace function set_like(p_mural uuid, p_device text, p_liked boolean) returns integer
language plpgsql security definer set search_path = public as $$
declare h text := request_ip_hash(); n integer;
begin
  if p_device is null or length(p_device) < 16 or length(p_device) > 64 then raise exception 'bad_device'; end if;
  if h is not null and (select count(*) from mural_likes where ip_hash = h and updated_at > now() - interval '10 minutes') >= 30 then
    raise exception 'rate_limited';
  end if;
  insert into mural_likes (mural_id, device_id, active, ip_hash) values (p_mural, p_device, p_liked, h)
    on conflict (mural_id, device_id) do update
      set active = excluded.active, ip_hash = excluded.ip_hash, updated_at = now()
      where mural_likes.active is distinct from excluded.active;
  update murals set like_count = (select count(*) from mural_likes where mural_id = p_mural and active)
    where id = p_mural returning like_count into n;
  return coalesce(n, 0);
end $$;
revoke all on function set_like(uuid, text, boolean) from public;
grant execute on function set_like(uuid, text, boolean) to anon, authenticated;
