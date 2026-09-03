# SG Remote Food Order

A statically-generated business directory of Singapore stores you can order from
before you arrive — **scan-to-order QR** spots and **app-based** chains — searchable
by region and service tag. Built for SEO: every store, region and tag is a
pre-rendered page with its own URL, metadata and structured data.

## Stack

- **Next.js 15** (App Router) — static generation (SSG) at build time
- **TypeScript** + **Tailwind CSS v4**
- **Supabase** (Postgres) — the source of truth, read at build time
- Client-side search over the full dataset (no runtime server needed)

## Two store types

| | App store (e.g. McDonald's) | QR store |
|---|---|---|
| Entries | One per brand | One per **branch** |
| Address | Usually none (in their app) | Yes, collected per branch |
| CTA | iOS / Android download links | Direct order link (behind the QR) |

Service tags (`takeaway`, `delivery`, `dine-in`) are separate from the store type
(`app` vs `qr`) and are shown as filterable pills.

## Getting started

```bash
npm install
npm run dev
```

The site runs immediately using the local seed data in [`data/seed.ts`](data/seed.ts)
— no Supabase needed for local development.

## Wiring up Supabase

1. Create a Supabase project.
2. Run the schema and seed against it (SQL editor, or the Supabase CLI):
   - [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   - [`supabase/seed.sql`](supabase/seed.sql)
3. Copy `.env.example` to `.env.local` and fill in:

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

When these env vars are set the data layer reads from Supabase; otherwise it falls
back to the local seed. The data is public read-only (enforced by RLS); writes go
through the dashboard or the service role.

## Static generation & rebuilds

Store data is fetched during `next build`, so **content changes require a rebuild**.
For a slowly-changing directory, either rebuild on a schedule or trigger a deploy
webhook when data changes.

```bash
npm run build   # prerenders /, /region/*, /store/*, /tag/*, sitemap.xml
```

## Routes

| Route | Purpose |
|---|---|
| `/` | Search + browse |
| `/store/[slug]` | Single store (QR order link or app downloads) |
| `/region/[region]` | Stores in a CDC region (central / north / north-east / east / west) |
| `/tag/[tag]` | Stores by service (takeaway / delivery / dine-in) |
| `/sitemap.xml` | Generated sitemap |
