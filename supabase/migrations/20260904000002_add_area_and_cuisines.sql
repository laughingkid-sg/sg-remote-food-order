-- Improvements: sub-location (area) on stores + a managed cuisines vocabulary.

-- 1. Sub-location for layer-2 filtering (e.g. "Tampines"). QR stores get a
--    specific area; app (brand-wide) stores usually leave it null.
alter table public.stores add column if not exists area text;

create index if not exists stores_area_idx on public.stores (area);

-- 2. Cuisines lookup table. `stores.cuisine` stays a text value; this table is
--    the controlled vocabulary the admin picks from (and can extend).
create table if not exists public.cuisines (
  id         bigint generated always as identity primary key,
  name       text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.cuisines enable row level security;

-- Public read; authenticated admins may add/edit (so a new cuisine persists).
grant select on public.cuisines to anon, authenticated;
grant insert, update, delete on public.cuisines to authenticated;

create policy cuisines_public_read on public.cuisines
  for select to anon, authenticated using (true);

create policy cuisines_auth_write on public.cuisines
  for all to authenticated using (true) with check (true);

-- 3. Seed default cuisines (existing ones in use + common SG categories).
insert into public.cuisines (name, sort_order) values
  ('Local', 10),
  ('Local Breakfast', 20),
  ('Hawker', 30),
  ('Chinese', 40),
  ('Malay', 50),
  ('Indian', 60),
  ('Halal', 70),
  ('Japanese', 80),
  ('Korean', 90),
  ('Thai', 100),
  ('Vietnamese', 110),
  ('Western', 120),
  ('Fast Food', 130),
  ('Seafood', 140),
  ('Vegetarian', 150),
  ('Cafe', 160),
  ('Coffee', 170),
  ('Bubble Tea', 180),
  ('Bakery', 190),
  ('Dessert', 200)
on conflict (name) do nothing;

-- 4. Backfill areas for the seeded QR stores.
update public.stores set area = 'Tampines'    where slug = 'kopitiam-toast-tampines';
update public.stores set area = 'Jurong East' where slug = 'kopitiam-toast-jurong';
update public.stores set area = 'Orchard'      where slug = 'bubble-tea-co-orchard';
update public.stores set area = 'Woodlands'    where slug = 'nasi-lemak-house-woodlands';
update public.stores set area = 'Ang Mo Kio'   where slug = 'hainan-chicken-rice-amk';
update public.stores set area = 'Bedok'        where slug = 'prata-corner-bedok';
