-- "Only with proof" auto-verify: a submission on an EXISTING mural that carries a photo AND a GPS position
-- (device or photo EXIF) within 50 m of the mural's pin verifies the location and applies the image, no admin step.
-- Everything else stays pending. GPS is reported by the client, so this raises the bar; it is not tamper-proof.
-- Never blocks a submission: any error inside is swallowed.
alter table submissions
  add column if not exists auto_verified boolean not null default false,
  add column if not exists auto_note text;

create or replace function submissions_auto_verify() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m murals%rowtype;
  d float8;
  base constant text := 'https://vnezefzguhjhlmbuktlm.supabase.co/storage/v1/object/public/submissions/';
  urls text[];
  placeholders boolean;
begin
  begin
    if new.mural_slug is null or new.kind not in ('location', 'photos_same', 'photos_repainted') then return null; end if;
    if coalesce(array_length(new.photo_paths, 1), 0) = 0 then return null; end if;
    if new.coordinates is null or new.location_source is null or new.location_source not in ('device', 'photo') then return null; end if;
    select * into m from murals where slug = new.mural_slug;
    if not found or m.coordinates is null or m.confidence = 'removed' then return null; end if;
    d := metres_between((m.coordinates->>'lat')::float8, (m.coordinates->>'lng')::float8,
                        (new.coordinates->>'lat')::float8, (new.coordinates->>'lng')::float8);
    if d > 50 then return null; end if;

    urls := array(select base || p from unnest(new.photo_paths) p);
    -- bundled placeholder photos (/murals/...) are replaced by the first real photos
    placeholders := not exists (select 1 from unnest(m.photos) p where p not like '/murals/%');

    if new.kind = 'photos_repainted' then
      update murals set photos = urls, cover_photo = urls[1],
             previous_photos = previous_photos || photos,
             artwork_status = 'changed', artwork_changed_at = now(),
             confidence = 'verified',
             precision = case when precision is null or precision = 'lead' then 'landmark' else precision end
       where id = m.id;
    else
      update murals set photos = case when placeholders then urls else photos || urls end,
             cover_photo = case when placeholders then urls[1] else coalesce(cover_photo, urls[1]) end,
             confidence = 'verified',
             precision = case when precision is null or precision = 'lead' then 'landmark' else precision end
       where id = m.id;
    end if;

    update submissions set status = 'approved', auto_verified = true,
           auto_note = round(d)::text || ' m from the pin (' || new.location_source || ' GPS)'
     where id = new.id;
  exception when others then
    null;
  end;
  return null;
end $$;

create or replace trigger submissions_auto_verify_trg after insert on submissions
  for each row execute function submissions_auto_verify();
