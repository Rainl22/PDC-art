-- One-way hash of the caller's IP (from PostgREST request headers). Used only for rate limiting; null when unavailable.
create or replace function request_ip_hash() returns text
language sql stable set search_path = public as $$
  select case when ip = '' then null else md5('murales-pdc|' || ip) end
  from (select trim(split_part(coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for', ''), ',', 1)) as ip) s
$$;

alter table comments    add column if not exists ip_hash text;
alter table submissions add column if not exists ip_hash text;
create index if not exists comments_ip_idx    on comments (ip_hash, created_at);
create index if not exists submissions_ip_idx on submissions (ip_hash, created_at);

-- Comments: size limits, max 1 link, 5 comments / 10 min / IP
create or replace function comments_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare h text := request_ip_hash();
begin
  if length(coalesce(new.body, '')) > 1000 or length(coalesce(new.author_name, '')) > 60 then
    raise exception 'too_long';
  end if;
  if (select count(*) from regexp_matches(coalesce(new.body, ''), 'https?://|www\.', 'gi')) > 1 then
    raise exception 'too_many_links';
  end if;
  new.ip_hash := h;
  if h is not null and coalesce(new.body, '') <> '' and
     (select count(*) from comments where ip_hash = h and body <> '' and created_at > now() - interval '10 minutes') >= 5 then
    raise exception 'rate_limited';
  end if;
  return new;
end $$;
drop trigger if exists comments_guard_trg on comments;
create trigger comments_guard_trg before insert on comments for each row execute function comments_guard();

-- Submissions: size limits, max 4 photos, 5 submissions / hour / IP
create or replace function submissions_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare h text := request_ip_hash();
begin
  if length(coalesce(new.title, '')) > 120 or length(coalesce(new.artist, '')) > 120
     or length(coalesce(new.location_description, '')) > 300 or length(coalesce(new.notes, '')) > 2000
     or coalesce(array_length(new.photo_paths, 1), 0) > 4 then
    raise exception 'too_long';
  end if;
  new.ip_hash := h;
  if h is not null and (select count(*) from submissions where ip_hash = h and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'rate_limited';
  end if;
  return new;
end $$;
drop trigger if exists submissions_guard_trg on submissions;
create trigger submissions_guard_trg before insert on submissions for each row execute function submissions_guard();

-- Votes: one per mural per IP per day. increment_vote previously ran as the caller, so RLS blocked it (counts never changed).
create table if not exists votes (
  id         uuid primary key default gen_random_uuid(),
  mural_id   uuid not null references murals(id) on delete cascade,
  ip_hash    text,
  col        text not null,
  created_at timestamptz not null default now()
);
alter table votes enable row level security;
create index if not exists votes_lookup_idx on votes (mural_id, ip_hash, created_at);

create or replace function increment_vote(mural_id uuid, col text) returns void
language plpgsql security definer set search_path = public as $$
declare h text := request_ip_hash();
begin
  if col not in ('still_here_count', 'removed_count', 'unsure_count') then
    raise exception 'bad_vote';
  end if;
  if h is not null and exists (
    select 1 from votes v where v.mural_id = increment_vote.mural_id and v.ip_hash = h and v.created_at > now() - interval '1 day'
  ) then
    raise exception 'already_voted';
  end if;
  insert into votes (mural_id, ip_hash, col) values (increment_vote.mural_id, h, col);
  if col = 'still_here_count' then
    update murals set still_here_count = still_here_count + 1 where id = increment_vote.mural_id;
  elsif col = 'removed_count' then
    update murals set removed_count = removed_count + 1 where id = increment_vote.mural_id;
  else
    update murals set unsure_count = unsure_count + 1 where id = increment_vote.mural_id;
  end if;
end $$;

alter function set_updated_at() set search_path = public;
