-- SG Remote Food Order — initial schema.
--
-- The directory is public, read-only data. Anyone may read; writes happen only
-- via the dashboard or the service role (which bypasses RLS), so no write
-- policies are granted to anon/authenticated.

create table if not exists public.stores (
  id              bigint generated always as identity primary key,
  slug            text not null unique,
  name            text not null,
  type            text not null check (type in ('app', 'qr')),
  description     text not null default '',
  cuisine         text not null default '',
  logo_url        text,
  region          text not null check (region in ('central', 'north', 'north-east', 'east', 'west')),
  address         text,
  order_url       text,
  app_ios_url     text,
  app_android_url text,
  featured        boolean not null default false,
  created_at      timestamptz not null default now(),

  -- QR stores need an order link; app stores need at least one download link.
  constraint stores_link_present check (
    (type = 'qr' and order_url is not null)
    or (type = 'app' and (app_ios_url is not null or app_android_url is not null))
  )
);

create index if not exists stores_region_idx on public.stores (region);
create index if not exists stores_type_idx on public.stores (type);

create table if not exists public.store_tags (
  store_id bigint not null references public.stores (id) on delete cascade,
  tag      text not null check (tag in ('takeaway', 'delivery', 'dine-in')),
  primary key (store_id, tag)
);

-- Row Level Security: public read-only.
alter table public.stores enable row level security;
alter table public.store_tags enable row level security;

create policy stores_public_read on public.stores
  for select
  to anon, authenticated
  using (true);

create policy store_tags_public_read on public.store_tags
  for select
  to anon, authenticated
  using (true);
