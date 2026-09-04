import type { MetadataRoute } from "next";
import { getStores } from "@/lib/data";
import { REGIONS } from "@/data/regions";
import { SITE } from "@/lib/site";

// Emit a static sitemap.xml at build time (required for `output: export`).
export const dynamic = "force-static";

const TAGS = ["takeaway", "delivery", "dine-in"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const stores = await getStores();

  return [
    { url: SITE.url, changeFrequency: "daily", priority: 1 },
    ...REGIONS.map((r) => ({
      url: `${SITE.url}/region/${r.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...TAGS.map((tag) => ({
      url: `${SITE.url}/tag/${tag}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...stores.map((s) => ({
      url: `${SITE.url}/store/${s.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
