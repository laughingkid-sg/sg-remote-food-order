-- App stores are brand-wide (the app supports many outlets), so a region is not
-- meaningful for them. Make region optional and clear it for app stores.
--
-- The existing `region in (...)` check constraint already passes on NULL, so it
-- needs no change.
alter table public.stores alter column region drop not null;

update public.stores set region = null, area = null where type = 'app';
