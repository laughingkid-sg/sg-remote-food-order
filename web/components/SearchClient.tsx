"use client";

import { useMemo, useState } from "react";
import type { RegionSlug, Store, StoreType } from "@/lib/types";
import { REGIONS } from "@/data/regions";
import { StoreCard } from "@/components/StoreCard";

type TypeFilter = "all" | StoreType;

/** Client-side search over the full store list. For this directory's scale the
 *  whole dataset ships to the browser and is filtered in memory — no server.
 *
 *  Region is multi-select: tappable chips on mobile, a native multi-select on
 *  desktop. Area is a single dependent dropdown scoped to the chosen regions. */
export function SearchClient({ stores }: { stores: Store[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [regions, setRegions] = useState<RegionSlug[]>([]);
  const [area, setArea] = useState<string>("all");

  // Areas that exist within the selected regions (or across all, if none chosen).
  const areaOptions = useMemo(() => {
    const inScope =
      regions.length === 0 ? stores : stores.filter((s) => regions.includes(s.region));
    return Array.from(
      new Set(inScope.map((s) => s.area).filter((a): a is string => Boolean(a))),
    ).sort((a, b) => a.localeCompare(b));
  }, [stores, regions]);

  // Keep the area valid for the current region selection.
  function clampAreaFor(nextRegions: RegionSlug[]) {
    const inScope =
      nextRegions.length === 0
        ? stores
        : stores.filter((s) => nextRegions.includes(s.region));
    const areas = new Set(inScope.map((s) => s.area).filter(Boolean));
    setArea((a) => (a !== "all" && !areas.has(a) ? "all" : a));
  }

  function toggleRegion(r: RegionSlug) {
    const next = regions.includes(r) ? regions.filter((x) => x !== r) : [...regions, r];
    setRegions(next);
    clampAreaFor(next);
  }

  function onMultiSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = Array.from(e.target.selectedOptions, (o) => o.value as RegionSlug);
    setRegions(next);
    clampAreaFor(next);
  }

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stores.filter((s) => {
      if (type !== "all" && s.type !== type) return false;
      if (regions.length > 0 && !regions.includes(s.region)) return false;
      if (area !== "all" && s.area !== area) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.cuisine.toLowerCase().includes(q) ||
        (s.area?.toLowerCase().includes(q) ?? false) ||
        (s.address?.toLowerCase().includes(q) ?? false) ||
        (s.postalCode?.includes(q) ?? false)
      );
    });
  }, [stores, query, type, regions, area]);

  const controlClass =
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

        {/* Region — chips on mobile, native multi-select on desktop. */}
        <div>
          <div className="mb-1 text-xs font-medium text-stone-500">
            Regions {regions.length > 0 && `(${regions.length})`}
          </div>
          <div className="flex flex-wrap gap-2 sm:hidden" role="group" aria-label="Filter by region">
            {REGIONS.map((r) => {
              const on = regions.includes(r.slug);
              return (
                <button
                  key={r.slug}
                  onClick={() => toggleRegion(r.slug)}
                  aria-pressed={on}
                  className={
                    "rounded-full px-3 py-1.5 text-sm font-medium transition " +
                    (on
                      ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300")
                  }
                >
                  {r.name}
                </button>
              );
            })}
          </div>
          <select
            multiple
            size={REGIONS.length}
            value={regions}
            onChange={onMultiSelect}
            className={"hidden sm:block " + controlClass}
            aria-label="Filter by region (select multiple)"
          >
            {REGIONS.map((r) => (
              <option key={r.slug} value={r.slug} className="px-1 py-0.5">
                {r.name}
              </option>
            ))}
          </select>
          {regions.length > 0 && (
            <button
              onClick={() => {
                setRegions([]);
                setArea("all");
              }}
              className="mt-1 text-xs text-stone-500 hover:underline"
            >
              Clear regions
            </button>
          )}
        </div>

        {/* Area — single dependent dropdown scoped to the selected regions. */}
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className={controlClass + (areaOptions.length === 0 ? " opacity-50" : "")}
          aria-label="Filter by area"
          disabled={areaOptions.length === 0}
        >
          <option value="all">{areaOptions.length === 0 ? "No areas" : "All areas"}</option>
          {areaOptions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
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
