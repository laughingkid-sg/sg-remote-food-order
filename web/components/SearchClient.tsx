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

  // Areas present in the data, grouped by region, for the merged location select.
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

  // A single value encodes the 2-layer selection: all / a whole region / an area.
  const locationValue =
    area !== "all" ? `a:${region}|${area}` : region !== "all" ? `r:${region}` : "all";

  function onLocationChange(v: string) {
    if (v.startsWith("a:")) {
      const [r, name] = v.slice(2).split("|");
      setRegion(r as RegionSlug);
      setArea(name);
    } else if (v.startsWith("r:")) {
      setRegion(v.slice(2) as RegionSlug);
      setArea("all");
    } else {
      setRegion("all");
      setArea("all");
    }
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
        <select
          value={locationValue}
          onChange={(e) => onLocationChange(e.target.value)}
          className="w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-base dark:border-white/15 dark:bg-stone-900"
          aria-label="Filter by region and area"
        >
          <option value="all">All regions</option>
          {REGIONS.map((r) => (
            <optgroup key={r.slug} label={r.name}>
              <option value={`r:${r.slug}`}>{r.name} (Others)</option>
              {(areasByRegion.get(r.slug) ?? []).map((a) => (
                <option key={a} value={`a:${r.slug}|${a}`}>
                  {a}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
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
