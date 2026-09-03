import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { RegionSlug } from "@/lib/types";
import { getStoresByRegion } from "@/lib/data";
import { REGIONS, REGION_BY_SLUG } from "@/data/regions";
import { StoreCard } from "@/components/StoreCard";

export async function generateStaticParams() {
  return REGIONS.map((r) => ({ region: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string }>;
}): Promise<Metadata> {
  const { region } = await params;
  const r = REGION_BY_SLUG.get(region as RegionSlug);
  if (!r) return {};
  return {
    title: `Order ahead in ${r.name} Singapore`,
    description: `Stores in the ${r.name} region of Singapore you can order from before you arrive.`,
    alternates: { canonical: `/region/${r.slug}` },
  };
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  const { region } = await params;
  const r = REGION_BY_SLUG.get(region as RegionSlug);
  if (!r) notFound();

  const stores = await getStoresByRegion(r.slug);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">{r.name} region</h1>
      <p className="mb-6 text-stone-600 dark:text-stone-400">
        {stores.length} {stores.length === 1 ? "store" : "stores"} you can order from ahead.
      </p>
      {stores.length === 0 ? (
        <p className="text-sm text-stone-500">No stores here yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <StoreCard key={store.slug} store={store} />
          ))}
        </div>
      )}
    </div>
  );
}
