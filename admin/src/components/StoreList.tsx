import { useState } from "react";
import { supabase } from "../supabase";
import type { StoreRecord } from "../types";

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

  if (stores.length === 0) {
    return <p className="hint">No stores yet. Create one above.</p>;
  }

  return (
    <div className="card">
      {error && <div className="msg error">{error}</div>}
      {stores.map((store) => (
        <div key={store.id} className="store-item">
          <div>
            <strong>{store.name}</strong>
            <span className={`badge ${store.type}`}>
              {store.type === "app" ? "App" : "Scan QR"}
            </span>
            <div className="hint">
              {store.region} · {store.cuisine || "—"}
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
      ))}
    </div>
  );
}
