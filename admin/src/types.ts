// Mirrors the shapes in web/lib/types.ts (kept in sync manually; the DB is the
// shared source of truth).

export type StoreType = "app" | "qr";
export type ServiceTag = "takeaway" | "delivery" | "dine-in";
export type RegionSlug = "central" | "north" | "north-east" | "east" | "west";

export const REGIONS: { slug: RegionSlug; name: string }[] = [
  { slug: "central", name: "Central" },
  { slug: "north", name: "North" },
  { slug: "north-east", name: "North-East" },
  { slug: "east", name: "East" },
  { slug: "west", name: "West" },
];

export const SERVICE_TAGS: ServiceTag[] = ["takeaway", "delivery", "dine-in"];

/** A row from the managed `cuisines` vocabulary table. */
export interface Cuisine {
  id: number;
  name: string;
}

/** A row from the `areas` vocabulary table (a sub-location within a region). */
export interface Area {
  id: number;
  name: string;
  region: RegionSlug;
}

/** A store row plus its tags, as used by the admin forms. */
export interface StoreRecord {
  id: number;
  slug: string;
  name: string;
  type: StoreType;
  description: string;
  cuisine: string;
  region: RegionSlug;
  area: string | null;
  address: string | null;
  postal_code: string | null;
  order_url: string | null;
  app_ios_url: string | null;
  app_android_url: string | null;
  featured: boolean;
  tags: ServiceTag[];
}

/** Editable fields for create/update (id excluded — generated). */
export type StoreDraft = Omit<StoreRecord, "id">;

export function emptyDraft(): StoreDraft {
  return {
    slug: "",
    name: "",
    type: "qr",
    description: "",
    cuisine: "",
    region: "central",
    area: "",
    address: "",
    postal_code: "",
    order_url: "",
    app_ios_url: "",
    app_android_url: "",
    featured: false,
    tags: [],
  };
}
