-- Postal code on stores. Singapore postal codes are precise (6 digits), so they
-- are useful for search and for a Google Maps lookup.
alter table public.stores add column if not exists postal_code text;

-- Backfill the seeded order-link stores from their addresses.
update public.stores set postal_code = '529510' where slug = 'kopitiam-toast-tampines';
update public.stores set postal_code = '608549' where slug = 'kopitiam-toast-jurong';
update public.stores set postal_code = '238801' where slug = 'bubble-tea-co-orchard';
update public.stores set postal_code = '738099' where slug = 'nasi-lemak-house-woodlands';
update public.stores set postal_code = '569933' where slug = 'hainan-chicken-rice-amk';
update public.stores set postal_code = '467360' where slug = 'prata-corner-bedok';
