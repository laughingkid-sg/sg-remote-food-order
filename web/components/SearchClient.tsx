"use client";

import { useMemo, useState } from "react";
import type { RegionSlug, Store, StoreType } from "@/lib/types";
import { StoreCard } from "@/components/StoreCard";
import { RegionAreaFilter } from "@/components/RegionAreaFilter";

type TypeFilter = "all" | StoreType;

/** Client-side search over the full store list. For this directory's scale the
 *  whole dataset ships to the browser and is filtered in memory — no server. */
export function SearchClient({ stores }: { stores: Store[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [regions, setRegions] = useState<RegionSlug[]>([]);
  const [areas, setAreas] = useState<string[]>([]);

  // Areas present in the data, grouped by region, for the hierarchical filter.
  const areasByRegion = useMemo(() => {
    const map = new Map<RegionSlug, string[]>();
    for (const s of stores) {
      if (!s.area) continue;
      const arr = map.get(s.region) ?? [];
      if (!arr.includes(s.area)) arr.push(s.area);
      map.set(s.region, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.localeCompare(b));
    return map;
  }, [stores]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const regionSet = new Set(regions);
    const areaSet = new Set(areas);
    const noLocation = regions.length === 0 && areas.length === 0;
    return stores.filter((s) => {
      if (type !== "all" && s.type !== type) return false;
      if (
        !noLocation &&
        !regionSet.has(s.region) &&
        !(s.area !== null && areaSet.has(s.area))
      )
        return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.cuisine.toLowerCase().includes(q) ||
        (s.area?.toLowerCase().includes(q) ?? false) ||
        (s.address?.toLowerCase().includes(q) ?? false) ||
        (s.postalCode?.includes(q) ?? false)
      );
    });
  }, [stores, query, type, regions, areas]);

  return (
    <div>
      <div className="mb-4 space-y-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stores, cuisine or area…"
          className="w-full rounded-lg border border-black/15 bg-white px-4 py-3 text-base outline-none focus:border-black/40 dark:border-white/15 dark:bg-stone-900"
          aria-label="Search stores"
        />
        <RegionAreaFilter
          areasByRegion={areasByRegion}
          selectedRegions={regions}
          selectedAreas={areas}
          onChange={(r, a) => {
            setRegions(r);
            setAreas(a);
          }}
        />
      </div>

      <div
        className="mb-6 flex gap-2 overflow-x-auto pb-1"
        role="group"
        aria-label="Filter by type"
      >
        {(["all", "app", "qr"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition " +
              (type === t
                ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300")
            }
          >
            {t === "all" ? "All" : t === "app" ? "App" : "Order Link"}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <p className="py-12 text-center text-sm text-stone-500">No stores match your search.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((store) => (
            <StoreCard key={store.slug} store={store} />
          ))}
        </div>
      )}
    </div>
  );
}
