// Core domain types for the SG Remote Food Order directory.

/** A store is either an "app" store (one entry, ordering happens in their own
 *  app) or a "qr" store (one entry per branch, ordering via a scanned QR link). */
export type StoreType = "app" | "qr";

/** Service tags shown as pills. Distinct from StoreType. */
export type ServiceTag = "takeaway" | "delivery" | "dine-in";

/** Singapore CDC regions — the taxonomy used for /region/[slug] pages. */
export type RegionSlug = "central" | "north" | "north-east" | "east" | "west";

export interface Region {
  slug: RegionSlug;
  name: string;
  sortOrder: number;
}

export interface Store {
  slug: string;
  name: string;
  type: StoreType;
  /** Short description / cuisine blurb for cards and meta description. */
  description: string;
  cuisine: string[];
  logoUrl: string | null;
  /** Region within Singapore. Null for brand-wide app stores (nationwide). */
  region: RegionSlug | null;
  /** Sub-location within the region (e.g. "Tampines") for layer-2 filtering.
   *  Set for QR stores; usually null for brand-wide app stores. */
  area: string | null;
  /** Human-readable address. Present for QR stores; usually null for app stores. */
  address: string | null;
  /** Singapore postal code (6 digits). Useful for search + Google Maps lookup. */
  postalCode: string | null;
  /** Service tags such as takeaway / delivery. */
  tags: ServiceTag[];

  // QR stores: direct ordering link (the URL behind the branch QR code).
  orderUrl: string | null;

  // App stores: store-listing download links.
  appIosUrl: string | null;
  appAndroidUrl: string | null;

  featured: boolean;
}

/** Lightweight shape shipped to the browser for client-side search. */
export interface SearchDoc {
  slug: string;
  name: string;
  type: StoreType;
  cuisine: string[];
  region: RegionSlug | null;
  area: string | null;
  tags: ServiceTag[];
  address: string | null;
}
