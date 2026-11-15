alter table murals
  add column if not exists artists jsonb,            -- [{ "name": text, "instagram": text|null }]
  add column if not exists photo_credit text,
  add column if not exists photo_credit_url text;
