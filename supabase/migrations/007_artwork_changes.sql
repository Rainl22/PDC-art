-- A mural can stay in the same place while the painting itself changes (repainted).
-- Location is tracked by `confidence`/`precision`; the artwork gets its own flag.
alter table murals
  add column if not exists artwork_status text not null default 'original' check (artwork_status in ('original','changed')),
  add column if not exists artwork_changed_at timestamptz,
  add column if not exists previous_photos text[] not null default '{}';

-- Photo updates for an existing mural come through the same submissions queue.
alter table submissions
  add column if not exists kind text not null default 'new' check (kind in ('new','location','photos_same','photos_repainted')),
  add column if not exists mural_slug text check (length(mural_slug) <= 120);
