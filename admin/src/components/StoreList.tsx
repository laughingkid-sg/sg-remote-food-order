import { useState } from "react";
import { supabase } from "../supabase";
import { SelectMenu } from "./SelectMenu";
import type { StoreRecord, StoreType } from "../types";

const PAGE_SIZE = 10;
type TypeFilter = "all" | StoreType;

export function StoreList({
  stores,
  onEdit,
  onChanged,
}: {
  stores: StoreRecord[];
  onEdit: (store: StoreRecord) => void;
  onChanged: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [page, setPage] = useState(0);

  async function onDelete(store: StoreRecord) {
    if (!confirm(`Delete “${store.name}”? This cannot be undone.`)) return;
    setError(null);
    setDeletingId(store.id);
    // store_tags cascade on delete via the FK.
    const { error } = await supabase.from("stores").delete().eq("id", store.id);
    setDeletingId(null);
    if (error) {
      setError(error.message);
      return;
    }
    onChanged();
  }

  const q = query.trim().toLowerCase();
  const filtered = stores.filter((s) => {
    if (typeFilter !== "all" && s.type !== typeFilter) return false;
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.slug.toLowerCase().includes(q) ||
      s.cuisine.toLowerCase().includes(q) ||
      s.region.toLowerCase().includes(q) ||
      (s.area?.toLowerCase().includes(q) ?? false) ||
      (s.postal_code?.includes(q) ?? false)
    );
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  // Reset to the first page whenever a filter changes.
  function onFilter<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(0);
    };
  }

  return (
    <div className="card">
      <div className="row" style={{ marginBottom: 12 }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <input
            type="search"
            value={query}
            onChange={(e) => onFilter(setQuery)(e.target.value)}
            placeholder="Search name, slug, cuisine or area…"
            aria-label="Search stores"
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <SelectMenu
            value={typeFilter}
            onChange={(v) => onFilter(setTypeFilter)(v as TypeFilter)}
            ariaLabel="Filter by type"
            groups={[
              {
                label: null,
                options: [
                  { value: "all", label: "All types" },
                  { value: "qr", label: "Order Link" },
                  { value: "app", label: "App" },
                ],
              },
            ]}
          />
        </div>
      </div>

      <p className="hint" style={{ marginBottom: 12 }}>
        {filtered.length} {filtered.length === 1 ? "store" : "stores"}
        {q || typeFilter !== "all" ? ` (of ${stores.length})` : ""}
      </p>

      {error && <div className="msg error">{error}</div>}

      {pageItems.length === 0 ? (
        <p className="hint">No stores match.</p>
      ) : (
        pageItems.map((store) => (
          <div key={store.id} className="store-item">
            <div>
              <strong>{store.name}</strong>
              <span className={`badge ${store.type}`}>
                {store.type === "app" ? "App" : "Order Link"}
              </span>
              <div className="hint">
                {store.area ? `${store.area}, ${store.region}` : store.region} ·{" "}
                {store.cuisine || "—"}
                {store.tags.length > 0 && ` · ${store.tags.join(", ")}`}
              </div>
            </div>
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              <button className="link" onClick={() => onEdit(store)}>
                Edit
              </button>
              <button
                className="danger"
                onClick={() => onDelete(store)}
                disabled={deletingId === store.id}
              >
                {deletingId === store.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        ))
      )}

      {pageCount > 1 && (
        <div className="pagination">
          <button
            className="secondary"
            onClick={() => setPage(safePage - 1)}
            disabled={safePage === 0}
          >
            ← Prev
          </button>
          <span className="hint">
            Page {safePage + 1} of {pageCount}
          </span>
          <button
            className="secondary"
            onClick={() => setPage(safePage + 1)}
            disabled={safePage >= pageCount - 1}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
