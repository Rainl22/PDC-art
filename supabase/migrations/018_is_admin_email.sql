-- Lets the sign-in form tell a stranger "sign-in is only for the team" before an email is sent.
-- Returns only true/false; callable by anyone (that is the point), so it does reveal whether an address is on the team list.
create or replace function is_admin_email(p_email text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where lower(email) = lower(trim(p_email)))
$$;
revoke all on function is_admin_email(text) from public;
grant execute on function is_admin_email(text) to anon, authenticated;
