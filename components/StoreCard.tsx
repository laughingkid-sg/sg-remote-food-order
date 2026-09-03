import Link from "next/link";
import type { Store } from "@/lib/types";
import { REGION_BY_SLUG } from "@/data/regions";
import { ServiceTagPill, TypePill } from "@/components/TagPill";

export function StoreCard({ store }: { store: Store }) {
  const region = REGION_BY_SLUG.get(store.region);
  return (
    <Link
      href={`/store/${store.slug}`}
      className="block rounded-xl border border-black/10 bg-white p-4 transition hover:shadow-md dark:border-white/10 dark:bg-stone-900"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-tight">{store.name}</h3>
        <TypePill type={store.type} />
      </div>
      <p className="mb-3 text-sm text-stone-600 dark:text-stone-400">{store.cuisine}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {region && (
          <span className="text-xs text-stone-500 dark:text-stone-500">{region.name}</span>
        )}
        <span className="text-stone-300 dark:text-stone-600">·</span>
        {store.tags.map((tag) => (
          <ServiceTagPill key={tag} tag={tag} />
        ))}
      </div>
    </Link>
  );
}
