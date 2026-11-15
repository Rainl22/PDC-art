-- Admin allowlist, keyed by (verified) email. Only the SECURITY DEFINER function below can read it.
-- Seed admins separately (do not commit emails):  insert into admins (email) values ('you@example.com');
create table if not exists admins (
  email      text primary key,
  created_at timestamptz not null default now()
);
alter table admins enable row level security;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from admins where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
$$;
revoke all on function is_admin() from public;
grant execute on function is_admin() to anon, authenticated;

-- murals / submissions: admin-only writes (previously ANY signed-in user)
drop policy if exists "murals_admin_all" on murals;
create policy "murals_admin_all" on murals for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "submissions_admin_read" on submissions;
drop policy if exists "submissions_admin_update" on submissions;
create policy "submissions_admin_read"   on submissions for select to authenticated using (is_admin());
create policy "submissions_admin_update" on submissions for update to authenticated using (is_admin()) with check (is_admin());
create policy "submissions_admin_delete" on submissions for delete to authenticated using (is_admin());

-- public can only create *pending* submissions
drop policy if exists "submissions_public_insert" on submissions;
create policy "submissions_public_insert" on submissions for insert to anon, authenticated with check (status = 'pending');

-- comment moderation
create policy "comments_admin_delete" on comments for delete to authenticated using (is_admin());

-- admin uploads to the mural photo bucket
create policy "mural_photos_admin_insert" on storage.objects for insert to authenticated with check (bucket_id = 'mural-photos' and is_admin());
create policy "mural_photos_admin_update" on storage.objects for update to authenticated using (bucket_id = 'mural-photos' and is_admin());
create policy "mural_photos_admin_delete" on storage.objects for delete to authenticated using (bucket_id = 'mural-photos' and is_admin());
