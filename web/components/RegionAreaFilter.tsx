"use client";

import { useState } from "react";
import type { RegionSlug } from "@/lib/types";
import { REGIONS } from "@/data/regions";

/** A custom checkbox visual (blue when on, dash when indeterminate). */
function Check({ state }: { state: "on" | "off" | "mixed" }) {
  return (
    <span
      className={
        "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition " +
        (state === "off"
          ? "border-stone-300 bg-white dark:border-stone-600 dark:bg-stone-800"
          : "border-blue-600 bg-blue-600 text-white")
      }
      aria-hidden
    >
      {state === "on" && (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 8.5l3.5 3.5L13 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {state === "mixed" && <span className="h-0.5 w-2.5 rounded bg-white" />}
    </span>
  );
}

/** Hierarchical region → area multi-select. Checking a region selects the whole
 *  region; checking areas refines it. Selection is (regions ∪ areas). */
export function RegionAreaFilter({
  areasByRegion,
  selectedRegions,
  selectedAreas,
  onChange,
}: {
  areasByRegion: Map<RegionSlug, string[]>;
  selectedRegions: RegionSlug[];
  selectedAreas: string[];
  onChange: (regions: RegionSlug[], areas: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const regionSet = new Set(selectedRegions);
  const areaSet = new Set(selectedAreas);

  function commit(regions: Set<RegionSlug>, areas: Set<string>) {
    onChange([...regions], [...areas]);
  }

  function toggleRegion(r: RegionSlug) {
    const regions = new Set(regionSet);
    const areas = new Set(areaSet);
    if (regions.has(r)) {
      regions.delete(r);
    } else {
      regions.add(r);
      (areasByRegion.get(r) ?? []).forEach((a) => areas.delete(a)); // subsumed
    }
    commit(regions, areas);
  }

  function toggleArea(r: RegionSlug, area: string) {
    const regions = new Set(regionSet);
    const areas = new Set(areaSet);
    const regionAreas = areasByRegion.get(r) ?? [];
    if (regions.has(r)) {
      // Whole region was selected → switch to "all areas except this one".
      regions.delete(r);
      regionAreas.forEach((a) => a !== area && areas.add(a));
    } else if (areas.has(area)) {
      areas.delete(area);
    } else {
      areas.add(area);
      // Promote to whole-region when every area ends up selected.
      if (regionAreas.length > 0 && regionAreas.every((a) => areas.has(a))) {
        regionAreas.forEach((a) => areas.delete(a));
        regions.add(r);
      }
    }
    commit(regions, areas);
  }

  const count = selectedRegions.length + selectedAreas.length;
  const label = count === 0 ? "All regions" : `${count} selected`;

  const q = query.trim().toLowerCase();
  const tree = REGIONS.map((r) => {
    const all = areasByRegion.get(r.slug) ?? [];
    const regionMatch = !q || r.name.toLowerCase().includes(q);
    const areas = regionMatch ? all : all.filter((a) => a.toLowerCase().includes(q));
    return { region: r, areas, visible: regionMatch || areas.length > 0 };
  }).filter((n) => n.visible);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-black/15 bg-white px-3 py-2.5 text-left text-base dark:border-white/15 dark:bg-stone-900"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className={count === 0 ? "text-stone-500" : ""}>{label}</span>
        <span className="text-stone-400">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute left-0 right-0 z-20 mt-1 rounded-lg border border-black/10 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-stone-900">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search region or area…"
              className="mb-2 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:bg-stone-800"
            />
            <div className="max-h-72 overflow-y-auto">
              {tree.length === 0 && (
                <p className="px-2 py-4 text-center text-sm text-stone-500">No matches.</p>
              )}
              {tree.map(({ region, areas }) => {
                const on = regionSet.has(region.slug);
                const someArea = areas.some((a) => areaSet.has(a));
                const parentState = on ? "on" : someArea ? "mixed" : "off";
                return (
                  <div key={region.slug} className="mb-1">
                    <button
                      type="button"
                      onClick={() => toggleRegion(region.slug)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-stone-100 dark:hover:bg-stone-800"
                    >
                      <Check state={parentState} />
                      <span className="font-semibold">{region.name}</span>
                    </button>
                    {areas.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => toggleArea(region.slug, a)}
                        className="flex w-full items-center gap-2 rounded-md py-1.5 pl-8 pr-2 text-left hover:bg-stone-100 dark:hover:bg-stone-800"
                      >
                        <Check state={on || areaSet.has(a) ? "on" : "off"} />
                        <span className="text-sm">{a}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
            {count > 0 && (
              <button
                type="button"
                onClick={() => onChange([], [])}
                className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-sm text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                Clear all
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
