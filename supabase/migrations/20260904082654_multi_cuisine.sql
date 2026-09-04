-- A store may serve more than one cuisine. Existing compound values used a
-- hyphen as a delimiter (for example, "Mexican-Turkish"); split every such
-- value while preserving the existing order.
alter table public.stores
  alter column cuisine drop default,
  alter column cuisine type text[] using
    case
      when btrim(cuisine) = '' then array[]::text[]
      else array_remove(regexp_split_to_array(btrim(cuisine), '\s*-\s*'), '')
    end,
  alter column cuisine set default array[]::text[];

-- Split every existing compound option before removing it from the managed
-- vocabulary. Preserve its sort order for each newly-created option.
insert into public.cuisines (name, sort_order)
select btrim(part), cuisine.sort_order
from public.cuisines as cuisine
cross join lateral regexp_split_to_table(cuisine.name, '\s*-\s*') as part
where cuisine.name like '%-%'
  and btrim(part) <> ''
on conflict (name) do nothing;

-- A compound cuisine may be present in a store but absent from the vocabulary.
-- Add each of its individual values so they are immediately selectable in admin.
insert into public.cuisines (name)
select distinct btrim(part)
from public.stores
cross join lateral unnest(cuisine) as part
where btrim(part) <> ''
on conflict (name) do nothing;

delete from public.cuisines
where name like '%-%';
