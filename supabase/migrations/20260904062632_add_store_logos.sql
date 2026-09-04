-- Public logo assets are readable by the directory, but only authenticated
-- admin users may upload or remove them.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'store-logos',
  'store-logos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Authenticated users can upload store logos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'store-logos'
  and (storage.foldername(name))[1] = 'stores'
);

create policy "Authenticated users can remove store logos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'store-logos'
  and (storage.foldername(name))[1] = 'stores'
);
