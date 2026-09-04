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
  const [area, setArea] = useState<string | "all">("all");

  // Layer-2 areas available within the chosen region (or across all regions).
  const areas = useMemo(() => {
    const inScope = region === "all" ? stores : stores.filter((s) => s.region === region);
    return Array.from(
      new Set(inScope.map((s) => s.area).filter((a): a is string => Boolean(a))),
    ).sort((a, b) => a.localeCompare(b));
  }, [stores, region]);

  function onRegionChange(next: RegionSlug | "all") {
    setRegion(next);
    setArea("all"); // reset the dependent filter
  }

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stores.filter((s) => {
      if (type !== "all" && s.type !== type) return false;
      if (region !== "all" && s.region !== region) return false;
      if (area !== "all" && s.area !== area) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.cuisine.toLowerCase().includes(q) ||
        (s.area?.toLowerCase().includes(q) ?? false) ||
        (s.address?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [stores, query, type, region, area]);

  const selectClass =
    "w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-base dark:border-white/15 dark:bg-stone-900";

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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            value={region}
            onChange={(e) => onRegionChange(e.target.value as RegionSlug | "all")}
            className={selectClass}
            aria-label="Filter by region"
          >
            <option value="all">All regions</option>
            {REGIONS.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.name}
              </option>
            ))}
          </select>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className={selectClass + (areas.length === 0 ? " opacity-50" : "")}
            aria-label="Filter by area"
            disabled={areas.length === 0}
          >
            <option value="all">{areas.length === 0 ? "No areas" : "All areas"}</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
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
