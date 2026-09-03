-- RLS policies decide which rows are visible, but the anon/authenticated roles
-- also need table-level SELECT privileges to read at all. Grant read-only
-- access for the public directory. Writes remain restricted to the service role.
grant usage on schema public to anon, authenticated;
grant select on public.stores to anon, authenticated;
grant select on public.store_tags to anon, authenticated;
