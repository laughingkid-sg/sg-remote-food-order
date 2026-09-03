# Admin console

A small Vite + React SPA for managing the directory's stores. Signs in with
**Supabase Auth** and writes under the authenticated-only RLS policies in
[`supabase/migrations/20260904000001_admin_write_access.sql`](../supabase/migrations/20260904000001_admin_write_access.sql).

## Run

From the repo root (npm workspaces):

```bash
npm run dev:admin      # http://localhost:5173
```

Config: copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` (Project Settings → API). The anon key is a public
client key — writes are gated by Auth + RLS, not by hiding it.

## One-time Supabase setup

1. **Apply the write-access migration** (opens up authenticated writes):

   ```bash
   supabase db push
   ```

2. **Disable public sign-ups**: Authentication → Providers → Email → turn off
   "Allow new users to sign up". This makes the project invite-only.

3. **Create your admin user**: Authentication → Users → Add user (email +
   password, mark email confirmed). Sign in with those credentials.

## What it does

- Create / edit / delete stores, including tags, for both store types
  (`app` download links vs `qr` order link).
- Reads and writes the same `stores` / `store_tags` tables the public site builds from.

## Note

Changes are written straight to the DB, but the public site is **statically
generated** — it won't reflect new data until it is rebuilt. Trigger a redeploy
(or a scheduled rebuild) after editing.
