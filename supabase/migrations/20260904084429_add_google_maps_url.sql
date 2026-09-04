-- An optional canonical Google Maps link is more precise than deriving a
-- search query from a free-form address.
alter table public.stores
  add column if not exists google_maps_url text;
