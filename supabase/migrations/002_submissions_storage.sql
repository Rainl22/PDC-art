-- Public bucket for community submission photos (uploads only; no listing/update/delete for anon)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('submissions', 'submissions', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "submissions_photos_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'submissions');
