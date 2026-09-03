import type { Region } from "@/lib/types";

/** Singapore CDC regions. Kept in code (not the DB) since they are a fixed,
 *  small taxonomy that both the app and the seed data reference. */
export const REGIONS: Region[] = [
  { slug: "central", name: "Central", sortOrder: 1 },
  { slug: "north", name: "North", sortOrder: 2 },
  { slug: "north-east", name: "North-East", sortOrder: 3 },
  { slug: "east", name: "East", sortOrder: 4 },
  { slug: "west", name: "West", sortOrder: 5 },
];

export const REGION_BY_SLUG = new Map(REGIONS.map((r) => [r.slug, r]));
