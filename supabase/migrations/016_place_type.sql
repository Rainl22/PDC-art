-- Where a mural is (tag on the mural page). Applied via the SQL tool. Values live in src/lib/places.ts + i18n ('place.*').
alter table murals add column if not exists place_type text
  check (place_type in ('restaurant','bar','school','dive_shop','hotel','gym'));

-- Photo credit is only shown while one of the credited (bundled /murals/...) photos is still displayed; clear stale ones.
update murals set photo_credit = null, photo_credit_url = null
where photo_credit is not null and not exists (select 1 from unnest(photos) p where p like '/murals/%');
