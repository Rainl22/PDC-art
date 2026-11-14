-- Murales PDC — initial schema

create extension if not exists "uuid-ossp";

-- murals table
create table murals (
  id                 uuid primary key default uuid_generate_v4(),
  slug               text unique not null,
  title              text not null,
  artist             text,
  artist_verified    boolean not null default false,
  location_description text not null,
  coordinates        jsonb,            -- { lat: number, lng: number } | null
  confidence         text not null check (confidence in ('verified','likely','unverified','removed')),
  precision          text check (precision in ('intersection','landmark','block','area','lead')),
  year               integer,
  medium             text,
  notes              text,
  photos             text[] not null default '{}',
  cover_photo        text,
  still_here_count   integer not null default 0,
  removed_count      integer not null default 0,
  unsure_count       integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- comments table
create table comments (
  id           uuid primary key default uuid_generate_v4(),
  mural_id     uuid not null references murals(id) on delete cascade,
  author_name  text,
  body         text not null,
  status_vote  text check (status_vote in ('still_here','removed','unsure')),
  created_at   timestamptz not null default now()
);

-- submissions (community-submitted murals, pending admin review)
create table submissions (
  id                   uuid primary key default uuid_generate_v4(),
  title                text,
  artist               text,
  location_description text not null,
  notes                text,
  photo_paths          text[] not null default '{}',
  status               text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at           timestamptz not null default now()
);

-- RPC to safely increment a vote column
create or replace function increment_vote(mural_id uuid, col text)
returns void language plpgsql as $$
begin
  if col = 'still_here_count' then
    update murals set still_here_count = still_here_count + 1 where id = mural_id;
  elsif col = 'removed_count' then
    update murals set removed_count = removed_count + 1 where id = mural_id;
  elsif col = 'unsure_count' then
    update murals set unsure_count = unsure_count + 1 where id = mural_id;
  end if;
end;
$$;

-- updated_at trigger
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger murals_updated_at
  before update on murals
  for each row execute function set_updated_at();

-- Row Level Security
alter table murals     enable row level security;
alter table comments   enable row level security;
alter table submissions enable row level security;

-- Public can read all murals
create policy "murals_public_read" on murals for select using (true);

-- Public can read comments
create policy "comments_public_read" on comments for select using (true);

-- Public can insert comments
create policy "comments_public_insert" on comments for insert with check (true);

-- Public can insert submissions
create policy "submissions_public_insert" on submissions for insert with check (true);

-- Only authenticated (admin) can manage murals and read submissions
create policy "murals_admin_all" on murals for all using (auth.role() = 'authenticated');
create policy "submissions_admin_read" on submissions for select using (auth.role() = 'authenticated');
create policy "submissions_admin_update" on submissions for update using (auth.role() = 'authenticated');
