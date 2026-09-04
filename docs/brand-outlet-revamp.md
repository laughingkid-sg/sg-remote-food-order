# Brand / Outlet Revamp — Plan

**Status:** Draft (not started) · for future revisit
**Created:** 2026-09-04
**Owner:** TBD

A two-stage plan to decouple **store location from the store itself**, so a
single brand can have many outlets. Written to revisit later — nothing here is
implemented yet.

---

## Background & goal

Today `stores` is a flat table where each row is effectively an *outlet* in
disguise:

- **App stores** (e.g. McDonald's) are collapsed into **one** row with download
  links and no real location.
- **Order-link stores** (e.g. Kopitiam Toast) are **one row per branch**, so the
  same brand appears as multiple disconnected rows.

We want a proper two-level model:

- A **brand** is introduced once (name, cuisine, description, logo, app download
  links).
- An **outlet** is a physical location under a brand (region, area, address,
  postal code, order link).

Then:

- **App brands** → outlets pulled automatically (scraping + CRON), so individual
  outlets become searchable while the brand keeps one app download.
- **Order-link brands** → outlets curated manually, each with its **own address
  and order link**.

## Target data model

```
brands
  id, slug, name, cuisine, description, logo_url,
  type            ('app' | 'link'),
  app_ios_url, app_android_url,       -- app brands only
  featured, created_at

outlets
  id, brand_id → brands.id,
  region, area, address, postal_code,
  order_url,                          -- link brands only
  source          ('scraped' | 'manual'),
  external_id,                        -- stable id from the scrape source (upsert key)
  active          (bool),             -- deactivate instead of delete
  updated_at, created_at

tags            -- service tags (takeaway / delivery / dine-in), at brand or outlet level (TBD)
cuisines, areas -- existing vocabularies, reused
```

**Non-negotiable field:** `outlets.source`. The CRON pipeline must only ever
touch `source = 'scraped'` rows so a re-scrape can never clobber a manually
curated order-link outlet. `external_id` is the upsert key; `active = false`
retires a closed outlet without a destructive delete.

## Guiding principles

- Ship the **schema decoupling first**; treat automated scraping and dynamic
  rendering as a *separate* later stage.
- Keep manual and scraped data in the same tables but strictly partitioned by
  `source`.
- Decide **host + search backend together** — the rendering model forces that
  choice (see Stage 2).

---

## Stage 1 — Decouple the schema (stay static, stay on Cloudflare)

**Objective:** introduce brands + outlets and adapt both apps, while keeping the
current **fully static** build on **Cloudflare Pages**. No scraping, no dynamic
rendering. Data stays curated and small, so pre-rendering everything is still
fine.

### Scope

- **DB**
  - New `brands` and `outlets` tables with RLS (public read; authenticated
    write), mirroring the current pattern.
  - Add `source`, `external_id`, `active` on `outlets` now (schema-ready for the
    Stage 2 CRON, even though nothing writes them yet).
  - **Data migration**: split existing `stores` rows into brands + outlets.
    - Group order-link rows by brand (e.g. the two Kopitiam Toast rows → one
      brand + two outlets).
    - Each app store → one brand + zero outlets (outlets arrive in Stage 2).
    - All migrated outlets get `source = 'manual'`, `active = true`.
  - Keep `stores` temporarily as a view or drop it once reads are migrated.

- **Web (`web/`)** — unchanged rendering approach (`output: 'export'`):
  - Reads move to brands + outlets.
  - Routes: `/brand/[slug]` (brand page listing its outlets), keep store-like
    pages as outlet pages, region/area pages list outlets.
  - Search still ships the (small, curated) dataset to the client — acceptable
    at this scale.
  - `generateStaticParams` still enumerates everything (hundreds of pages max).

- **Admin (`admin/`)**
  - Two-level CRUD: manage a **brand**, then its **outlets**.
  - Order-link outlets: manual entry (address + order link), reusing the current
    location picker, cuisine combobox, etc.
  - App brands: brand-level fields only; outlets read-only placeholder (“managed
    by the pipeline in Stage 2”).

### Explicitly out of scope for Stage 1

- Scraping / CRON pipeline.
- Any dynamic / on-demand rendering.
- Search backend (Postgres FTS / Meilisearch / Algolia).
- Host change — remains Cloudflare Pages static.

### Exit criteria

- Existing 10 stores are represented as brands + outlets with no data loss.
- Both apps build and typecheck; web still deploys as a static export to
  Cloudflare Pages.
- Admin can create a brand and add/edit its manual outlets.
- `source` / `external_id` / `active` exist and are respected by reads (only
  `active` outlets shown).

---

## Stage 2 — Dynamic rendering + automated pipeline

**Objective:** turn on scraping for app brands (volume jumps to thousands of
outlets) and move to a **hybrid** rendering model that scales, with a real
search backend. This is where the host/search decisions land.

### Scope

- **Scraping + CRON**
  - Per-brand scrapers pull outlets from each source (store locators / APIs).
  - CRON **upserts by `external_id`**, writing only `source = 'scraped'` rows.
  - Closed/missing outlets set `active = false` (never hard-deleted); a partial
    scrape must not deactivate everything (guard with per-run sanity checks).
  - Manual order-link outlets are untouched by the pipeline.

- **Search backend** (dataset no longer fits “ship it all to the browser”)
  - Options: **Postgres full-text search** (simplest, already have the DB),
    **Meilisearch** (great DX, typo-tolerant), or **Algolia** (managed).
  - Search page 1 stays pre-rendered/curated; **page 2+ and filtered queries
    call the search endpoint**.

- **Rendering model** — “static shell, dynamic tail”
  - Static at build: landing page, **brand pages** (hundreds), region/area
    **first page** of curated/featured results.
  - `generateStaticParams` returns only the **featured/top subset**;
    `dynamicParams = true` renders the rest **on demand + caches** (ISR).
  - Individual outlet pages: on-demand ISR (popular ones effectively become
    static after first hit; dead ones never cost a build).

- **Host decision (forced by hybrid rendering — `output: 'export'` no longer
  works)**
  - **Cloudflare** (to stay) → adopt **`@opennextjs/cloudflare`** (Next on
    Workers) for ISR/SSR + a search API route.
  - **Vercel** → native ISR with zero config; least resistance if going
    comprehensive-scale.
  - Pick **with** the search backend, not before.

### Exit criteria

- App brands show real, searchable outlets kept fresh by CRON.
- Search scales to thousands of outlets via the chosen backend.
- Brand pages remain static/SEO-strong; outlet long-tail renders on demand.
- Re-scrapes never overwrite manual outlets; closed outlets deactivate cleanly.

---

## Cross-cutting decisions to make before Stage 2

| Decision | Options | Notes |
|---|---|---|
| Host | Cloudflare (OpenNext) vs Vercel | Vercel = easiest ISR; Cloudflare = stay put, more setup |
| Search | Postgres FTS vs Meilisearch vs Algolia | Start with Postgres FTS if staying lean |
| Tags level | brand vs outlet | Service tags may differ per outlet (delivery at some branches only) |
| Scale target | curated hundreds vs comprehensive thousands | Determines whether Stage 2 is even needed |

## Risks / watch-items

- **Partial-scrape blast radius** — a bad scrape run deactivating good outlets.
  Mitigate with per-run thresholds (e.g. refuse to deactivate >X% at once).
- **Manual/scraped collision** — prevented only by strict `source` partitioning;
  never let the pipeline write `source='manual'` rows.
- **Build-time explosion** — the reason Stage 2 exists; do not attempt to
  statically pre-render thousands of outlet pages.
- **SEO continuity** — keep brand/outlet URLs stable across the Stage 1 split
  (redirects from any old `/store/[slug]` paths if they were indexed).

## Open questions

- Do app brands ever have order links per outlet, or only the app download?
- Should an outlet without a scrape source (manual link store) live under the
  same `outlets` table (yes, per this plan) or a separate one? (Plan: same
  table, partitioned by `source`.)
- Is “featured” a brand-level or outlet-level concept for the static first page?
