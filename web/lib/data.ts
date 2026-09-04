import "server-only";
import { cache } from "react";
import type { RegionSlug, SearchDoc, ServiceTag, Store, StoreType } from "@/lib/types";
import { getSupabase } from "@/lib/supabase";
import { SEED_STORES } from "@/data/seed";

/** Shape of a row from the `stores` table joined with its tags. */
interface StoreRow {
  slug: string;
  name: string;
  type: StoreType;
  description: string;
  cuisine: string;
  logo_url: string | null;
  region: RegionSlug | null;
  area: string | null;
  address: string | null;
  postal_code: string | null;
  order_url: string | null;
  app_ios_url: string | null;
  app_android_url: string | null;
  featured: boolean;
  store_tags: { tag: ServiceTag }[] | null;
}

function rowToStore(row: StoreRow): Store {
  return {
    slug: row.slug,
    name: row.name,
    type: row.type,
    description: row.description,
    cuisine: row.cuisine,
    logoUrl:
      row.logo_url && process.env.NODE_ENV === "production"
        ? `/store-logos/${row.slug}.webp`
        : row.logo_url,
    region: row.region,
    area: row.area,
    address: row.address,
    postalCode: row.postal_code,
    tags: (row.store_tags ?? []).map((t) => t.tag),
    orderUrl: row.order_url,
    appIosUrl: row.app_ios_url,
    appAndroidUrl: row.app_android_url,
    featured: row.featured,
  };
}

/** All stores, read once per build. Uses Supabase when configured, otherwise
 *  the local seed. Wrapped in React.cache so a single build shares one fetch. */
export const getStores = cache(async (): Promise<Store[]> => {
  const supabase = getSupabase();

  if (!supabase) {
    return SEED_STORES;
  }

  const { data, error } = await supabase
    .from("stores")
    .select(
      "slug, name, type, description, cuisine, logo_url, region, area, address, postal_code, order_url, app_ios_url, app_android_url, featured, store_tags(tag)",
    )
    .order("name");

  if (error) {
    throw new Error(`Failed to load stores from Supabase: ${error.message}`);
  }

  return (data as StoreRow[]).map(rowToStore);
});

export async function getStoreBySlug(slug: string): Promise<Store | undefined> {
  const stores = await getStores();
  return stores.find((s) => s.slug === slug);
}

export async function getStoresByRegion(region: RegionSlug): Promise<Store[]> {
  const stores = await getStores();
  return stores.filter((s) => s.region === region);
}

export async function getStoresByTag(tag: ServiceTag): Promise<Store[]> {
  const stores = await getStores();
  return stores.filter((s) => s.tags.includes(tag));
}

export async function getFeaturedStores(): Promise<Store[]> {
  const stores = await getStores();
  return stores.filter((s) => s.featured);
}

/** Minimal payload for client-side search. */
export async function getSearchDocs(): Promise<SearchDoc[]> {
  const stores = await getStores();
  return stores.map(({ slug, name, type, cuisine, region, area, tags, address }) => ({
    slug,
    name,
    type,
    cuisine,
    region,
    area,
    tags,
    address,
  }));
}
