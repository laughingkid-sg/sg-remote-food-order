# SG Remote Food Order

A directory of Singapore stores you can order from before you arrive — scan-to-order
QR spots and app-based chains. Monorepo with two apps sharing one Supabase project.

```
.
├── web/        # Public directory — Next.js 15, statically generated for SEO
├── admin/      # Admin console — Vite + React SPA, Supabase Auth, creates records
└── supabase/   # Shared schema, RLS policies and migrations
```

## Setup

Uses npm workspaces — one install covers both apps:

```bash
npm install
```

| Command | What it does |
|---|---|
| `npm run dev:web` | Public site at http://localhost:3000 |
| `npm run build:web` | Static build of the public site |
| `npm run dev:admin` | Admin console at http://localhost:5173 |
| `npm run build:admin` | Production build of the admin console |

Each app has its own `.env` (`.env.local` for `web/`, `.env` for `admin/`) — see the
`.env.example` in each and the app-level READMEs.

## Supabase

The schema, RLS and seed live in [`supabase/migrations/`](supabase/migrations) and are
shared by both apps. The public site reads with the **anon** key (read-only RLS); the
admin console authenticates with **Supabase Auth** and writes under authenticated-only
RLS policies. See [web/README.md](web/README.md) and [admin/README.md](admin/README.md).
