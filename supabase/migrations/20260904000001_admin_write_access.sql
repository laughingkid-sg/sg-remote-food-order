-- Admin write access.
--
-- The public site reads with the anon key (read-only). The admin console signs
-- in via Supabase Auth, so grant write access to the `authenticated` role only.
-- Keep public sign-ups disabled in Auth settings so only invited admins exist.

grant insert, update, delete on public.stores to authenticated;
grant insert, update, delete on public.store_tags to authenticated;

-- Any signed-in user may write. (Row visibility for reads is still covered by
-- the existing public read policies; these add insert/update/delete.)
create policy stores_auth_write on public.stores
  for all
  to authenticated
  using (true)
  with check (true);

create policy store_tags_auth_write on public.store_tags
  for all
  to authenticated
  using (true)
  with check (true);
