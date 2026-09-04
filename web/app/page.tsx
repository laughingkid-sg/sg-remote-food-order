import Link from "next/link";
import { getStores } from "@/lib/data";
import { REGIONS } from "@/data/regions";
import { SearchClient } from "@/components/SearchClient";

export default async function HomePage() {
  const stores = await getStores();

  return (
    <div>
      <section className="mb-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          Order ahead, skip the queue
        </h1>
        <p className="max-w-2xl text-stone-600 dark:text-stone-400">
          Find Singapore stores you can order from before you arrive — order-link
          spots and app-based chains, searchable by region and area.
        </p>
      </section>

      <SearchClient stores={stores} />

      <section className="mt-12">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
          Browse by region
        </h2>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((r) => (
            <Link
              key={r.slug}
              href={`/region/${r.slug}`}
              className="rounded-lg border border-black/10 px-3 py-1.5 text-sm hover:bg-stone-100 dark:border-white/10 dark:hover:bg-stone-800"
            >
              {r.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
