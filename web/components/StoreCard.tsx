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
      <h3 className="mb-1.5 font-semibold leading-tight">{store.name}</h3>
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <TypePill type={store.type} />
        {store.cuisine && (
          <span className="text-sm text-stone-600 dark:text-stone-400">{store.cuisine}</span>
        )}
      </div>
      {region && (
        <p className="mb-2 text-xs text-stone-500 dark:text-stone-500">
          {store.area ? `${store.area}, ${region.name}` : region.name}
        </p>
      )}
      {store.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {store.tags.map((tag) => (
            <ServiceTagPill key={tag} tag={tag} />
          ))}
        </div>
      )}
    </Link>
  );
}
