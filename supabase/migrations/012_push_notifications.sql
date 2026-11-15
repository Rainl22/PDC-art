-- Push notifications for new submissions (applied via the SQL tool; the notify-submission Edge Function is deployed separately).
-- Flow: insert on submissions -> submissions_notify_trg -> pg_net POST -> Edge Function notify-submission -> Web Push to
-- every row in push_subscriptions. Keys live in app_secrets (RLS on, no policies: not readable through the public API).
create table if not exists push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid(),
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
alter table push_subscriptions enable row level security;
create policy "push_subs_admin_all" on push_subscriptions for all to authenticated
  using (is_admin() and user_id = auth.uid()) with check (is_admin() and user_id = auth.uid());

create table if not exists app_secrets (name text primary key, value text not null);
alter table app_secrets enable row level security;
revoke all on app_secrets from anon, authenticated;
-- rows vapid_public, vapid_private, notify_secret were inserted directly (never committed)

create extension if not exists pg_net;

create or replace function submissions_notify() returns trigger
language plpgsql security definer set search_path = public, extensions, net as $$
declare sec text;
begin
  begin
    select value into sec from app_secrets where name = 'notify_secret';
    if sec is not null then
      perform net.http_post(
        url := 'https://vnezefzguhjhlmbuktlm.supabase.co/functions/v1/notify-submission',
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', sec),
        body := jsonb_build_object('id', new.id)
      );
    end if;
  exception when others then
    null; -- a notification problem must never block a submission
  end;
  return null;
end $$;

create or replace trigger submissions_notify_trg after insert on submissions
  for each row execute function submissions_notify();
