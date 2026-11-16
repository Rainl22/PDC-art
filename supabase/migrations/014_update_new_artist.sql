-- "Update" (a new mural at the same spot) can carry a new artist as well as a new name. The old name and artist stay with the
-- old photos in murals.artwork_history. Replaces submissions_auto_verify() from 011. Applied via the SQL tool.
create or replace function submissions_auto_verify() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m murals%rowtype;
  d float8;
  base constant text := 'https://vnezefzguhjhlmbuktlm.supabase.co/storage/v1/object/public/submissions/';
  urls text[];
  placeholders boolean;
  new_name text;
  new_artist text;
  new_artists jsonb;
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
    placeholders := not exists (select 1 from unnest(m.photos) p where p not like '/murals/%');

    if new.kind = 'photos_repainted' then
      new_name := case when nullif(btrim(new.title), '') is not null and lower(btrim(new.title)) <> lower(btrim(m.title)) then btrim(new.title) end;
      new_artist := case when nullif(btrim(new.artist), '') is not null and lower(btrim(new.artist)) <> lower(btrim(coalesce(m.artist, ''))) then btrim(new.artist) end;
      if new_artist is not null then
        select jsonb_agg(jsonb_build_object('name', coalesce(a.name, n.name), 'instagram', a.instagram, 'url', a.url))
          into new_artists
          from (select btrim(x) as name from unnest(string_to_array(new_artist, ',')) x where btrim(x) <> '') n
          left join artists a on lower(a.name) = lower(n.name);
      end if;
      update murals set photos = urls, cover_photo = urls[1],
             title = coalesce(new_name, title),
             artist = coalesce(new_artist, artist),
             artists = case when new_artist is not null then new_artists else artists end,
             artist_verified = case when new_artist is not null then true else artist_verified end,
             previous_photos = previous_photos || photos,
             artwork_history = artwork_history || jsonb_build_object('title', m.title, 'artist', m.artist, 'photos', to_jsonb(m.photos), 'replaced_at', now()),
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
                       || coalesce(', renamed to ' || new_name, '') || coalesce(', artist ' || new_artist, '')
     where id = new.id;
  exception when others then
    null;
  end;
  return null;
end $$;
