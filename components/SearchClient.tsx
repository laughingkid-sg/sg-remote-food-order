"use client";

import { useMemo, useState } from "react";
import type { RegionSlug, Store, StoreType } from "@/lib/types";
import { REGIONS } from "@/data/regions";
import { StoreCard } from "@/components/StoreCard";

type TypeFilter = "all" | StoreType;

/** Client-side search over the full store list. For this directory's scale the
 *  whole dataset ships to the browser and is filtered in memory — no server. */
export function SearchClient({ stores }: { stores: Store[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [region, setRegion] = useState<RegionSlug | "all">("all");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stores.filter((s) => {
      if (type !== "all" && s.type !== type) return false;
      if (region !== "all" && s.region !== region) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.cuisine.toLowerCase().includes(q) ||
        (s.address?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [stores, query, type, region]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stores, cuisine or area…"
          className="flex-1 rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-stone-900"
          aria-label="Search stores"
        />
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value as RegionSlug | "all")}
          className="rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm dark:border-white/15 dark:bg-stone-900"
          aria-label="Filter by region"
        >
          <option value="all">All regions</option>
          {REGIONS.map((r) => (
            <option key={r.slug} value={r.slug}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6 flex gap-2" role="group" aria-label="Filter by type">
        {(["all", "app", "qr"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={
              "rounded-full px-3 py-1.5 text-sm font-medium transition " +
              (type === t
                ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300")
            }
          >
            {t === "all" ? "All" : t === "app" ? "App" : "Scan QR"}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <p className="py-12 text-center text-sm text-stone-500">No stores match your search.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((store) => (
            <StoreCard key={store.slug} store={store} />
          ))}
        </div>
      )}
    </div>
  );
}
