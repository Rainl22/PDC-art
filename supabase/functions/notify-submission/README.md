Deployed with the Supabase tool (verify_jwt: false; it authenticates with the `x-notify-secret` header against `app_secrets`).
Source is kept here for reference: it sends a Web Push (npm:web-push) to every row in `push_subscriptions`, building the
message from the stored submission. Dead subscriptions (404/410) are deleted automatically.
