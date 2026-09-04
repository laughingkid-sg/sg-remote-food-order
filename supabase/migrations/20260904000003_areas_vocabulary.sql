-- Areas as a controlled vocabulary, grouped by region.
--
-- The admin picks a store's sub-location from a fixed select (no free text), so
-- the valid areas live in the DB. `stores.area` stays a text value that mirrors
-- the chosen area name.

create table if not exists public.areas (
  id         bigint generated always as identity primary key,
  name       text not null,
  region     text not null check (region in ('central', 'north', 'north-east', 'east', 'west')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (name, region)
);

create index if not exists areas_region_idx on public.areas (region);

alter table public.areas enable row level security;

grant select on public.areas to anon, authenticated;
grant insert, update, delete on public.areas to authenticated;

create policy areas_public_read on public.areas
  for select to anon, authenticated using (true);

create policy areas_auth_write on public.areas
  for all to authenticated using (true) with check (true);

-- Seed SG areas per CDC region.
insert into public.areas (name, region) values
  -- Central
  ('Orchard', 'central'),
  ('Newton', 'central'),
  ('Novena', 'central'),
  ('Toa Payoh', 'central'),
  ('Bishan', 'central'),
  ('Bukit Merah', 'central'),
  ('Queenstown', 'central'),
  ('Bukit Timah', 'central'),
  ('Marina Bay', 'central'),
  ('Downtown', 'central'),
  ('Rochor', 'central'),
  ('Kallang', 'central'),
  -- North
  ('Woodlands', 'north'),
  ('Sembawang', 'north'),
  ('Yishun', 'north'),
  ('Admiralty', 'north'),
  ('Marsiling', 'north'),
  ('Mandai', 'north'),
  -- North-East
  ('Ang Mo Kio', 'north-east'),
  ('Hougang', 'north-east'),
  ('Sengkang', 'north-east'),
  ('Punggol', 'north-east'),
  ('Serangoon', 'north-east'),
  ('Seletar', 'north-east'),
  -- East
  ('Bedok', 'east'),
  ('Tampines', 'east'),
  ('Pasir Ris', 'east'),
  ('Changi', 'east'),
  ('Katong', 'east'),
  ('Marine Parade', 'east'),
  ('Simei', 'east'),
  -- West
  ('Jurong East', 'west'),
  ('Jurong West', 'west'),
  ('Clementi', 'west'),
  ('Bukit Batok', 'west'),
  ('Bukit Panjang', 'west'),
  ('Choa Chu Kang', 'west'),
  ('Boon Lay', 'west'),
  ('Pioneer', 'west')
on conflict (name, region) do nothing;
