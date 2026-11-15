alter table submissions
  add column if not exists coordinates jsonb,        -- { "lat": number, "lng": number }
  add column if not exists location_source text check (location_source in ('link','device','photo','manual'));
