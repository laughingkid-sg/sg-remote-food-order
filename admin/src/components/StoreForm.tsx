import { useState, type FormEvent } from "react";
import { supabase } from "../supabase";
import {
  REGIONS,
  SERVICE_TAGS,
  emptyDraft,
  type Area,
  type Cuisine,
  type RegionSlug,
  type ServiceTag,
  type StoreDraft,
  type StoreRecord,
  type StoreType,
} from "../types";

/** Turn "" into null for nullable columns. */
function orNull(v: string): string | null {
  const t = v.trim();
  return t === "" ? null : t;
}

/** Red asterisk marking a required field. */
function Req() {
  return <span className="req"> *</span>;
}

export function StoreForm({
  initial,
  cuisines,
  areas,
  onDone,
}: {
  initial: StoreRecord | null;
  cuisines: Cuisine[];
  areas: Area[];
  onDone: () => void;
}) {
  const editingId = initial?.id ?? null;
  const [draft, setDraft] = useState<StoreDraft>(
    initial ? { ...initial } : emptyDraft(),
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof StoreDraft>(key: K, value: StoreDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function toggleTag(tag: ServiceTag) {
    setDraft((d) => ({
      ...d,
      tags: d.tags.includes(tag) ? d.tags.filter((t) => t !== tag) : [...d.tags, tag],
    }));
  }

  // Merged region → area picker. Areas grouped by region (from the areas table).
  const areasByRegion = new Map<RegionSlug, Area[]>();
  for (const a of areas) {
    const arr = areasByRegion.get(a.region) ?? [];
    arr.push(a);
    areasByRegion.set(a.region, arr);
  }

  const locationValue = draft.area
    ? `a:${draft.region}|${draft.area}`
    : `r:${draft.region}`;

  function onLocationChange(v: string) {
    if (v.startsWith("a:")) {
      const [r, name] = v.slice(2).split("|");
      setDraft((d) => ({ ...d, region: r as RegionSlug, area: name }));
    } else {
      setDraft((d) => ({ ...d, region: v.slice(2) as RegionSlug, area: "" }));
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const cuisine = draft.cuisine.trim();
    const row = {
      slug: draft.slug.trim(),
      name: draft.name.trim(),
      type: draft.type,
      description: draft.description.trim(),
      cuisine,
      region: draft.region,
      area: orNull(draft.area ?? ""),
      address: orNull(draft.address ?? ""),
      order_url: draft.type === "qr" ? orNull(draft.order_url ?? "") : null,
      app_ios_url: draft.type === "app" ? orNull(draft.app_ios_url ?? "") : null,
      app_android_url: draft.type === "app" ? orNull(draft.app_android_url ?? "") : null,
      featured: draft.featured,
    };

    // Persist a brand-new cuisine into the vocabulary so it becomes a default.
    const isNewCuisine =
      cuisine !== "" &&
      !cuisines.some((c) => c.name.toLowerCase() === cuisine.toLowerCase());
    if (isNewCuisine) {
      await supabase.from("cuisines").insert({ name: cuisine });
    }

    let storeId = editingId;
    if (editingId) {
      const { error } = await supabase.from("stores").update(row).eq("id", editingId);
      if (error) return fail(error.message);
    } else {
      const { data, error } = await supabase
        .from("stores")
        .insert(row)
        .select("id")
        .single();
      if (error) return fail(error.message);
      storeId = data.id;
    }

    await supabase.from("store_tags").delete().eq("store_id", storeId!);
    if (draft.tags.length > 0) {
      const { error } = await supabase
        .from("store_tags")
        .insert(draft.tags.map((tag) => ({ store_id: storeId!, tag })));
      if (error) return fail(error.message);
    }

    setBusy(false);
    onDone();
  }

  function fail(message: string) {
    setError(message);
    setBusy(false);
  }

  const isApp = draft.type === "app";

  return (
    <div className="card">
      <h1 style={{ fontSize: 16, marginBottom: 4 }}>
        {editingId ? `Edit “${initial?.name}”` : "New store"}
      </h1>
      <p className="hint" style={{ marginTop: 0, marginBottom: 16 }}>
        <span className="req">*</span> required
      </p>
      {error && <div className="msg error">{error}</div>}
      <form onSubmit={onSubmit}>
        <div className="row">
          <div className="field">
            <label htmlFor="type">
              Type <Req />
            </label>
            <select
              id="type"
              value={draft.type}
              onChange={(e) => set("type", e.target.value as StoreType)}
            >
              <option value="qr">Order Link (per branch)</option>
              <option value="app">App (download links)</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="location">
              Location <Req /> <span className="hint">— region › area</span>
            </label>
            <select
              id="location"
              value={locationValue}
              onChange={(e) => onLocationChange(e.target.value)}
            >
              {REGIONS.map((r) => (
                <optgroup key={r.slug} label={r.name}>
                  <option value={`r:${r.slug}`}>{r.name} (Others)</option>
                  {(areasByRegion.get(r.slug) ?? []).map((a) => (
                    <option key={a.id} value={`a:${r.slug}|${a.name}`}>
                      {a.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <div className="row">
          <div className="field">
            <label htmlFor="name">
              Name <Req />
            </label>
            <input
              id="name"
              type="text"
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="slug">
              Slug <Req /> <span className="hint">— URL id, e.g. kopitiam-toast-tampines</span>
            </label>
            <input
              id="slug"
              type="text"
              value={draft.slug}
              onChange={(e) => set("slug", e.target.value)}
              pattern="[a-z0-9-]+"
              required
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="cuisine">
            Cuisine <span className="hint">— pick one or type a new one</span>
          </label>
          <input
            id="cuisine"
            type="text"
            list="cuisine-list"
            value={draft.cuisine}
            onChange={(e) => set("cuisine", e.target.value)}
            placeholder="e.g. Local, Japanese…"
          />
          <datalist id="cuisine-list">
            {cuisines.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </div>

        <div className="field">
          <label htmlFor="address">
            Address <span className="hint">— usually only for order-link stores</span>
          </label>
          <input
            id="address"
            type="text"
            value={draft.address ?? ""}
            onChange={(e) => set("address", e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        {isApp ? (
          <div className="row">
            <div className="field">
              <label htmlFor="ios">
                iOS download URL <span className="hint">— iOS or Android required</span>
              </label>
              <input
                id="ios"
                type="url"
                value={draft.app_ios_url ?? ""}
                onChange={(e) => set("app_ios_url", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="android">Android download URL</label>
              <input
                id="android"
                type="url"
                value={draft.app_android_url ?? ""}
                onChange={(e) => set("app_android_url", e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="field">
            <label htmlFor="order">
              Order URL <Req /> <span className="hint">— the link behind the QR code</span>
            </label>
            <input
              id="order"
              type="url"
              value={draft.order_url ?? ""}
              onChange={(e) => set("order_url", e.target.value)}
              required
            />
          </div>
        )}

        <div className="field">
          <label>Service tags</label>
          <div className="checkboxes">
            {SERVICE_TAGS.map((tag) => (
              <label key={tag}>
                <input
                  type="checkbox"
                  checked={draft.tags.includes(tag)}
                  onChange={() => toggleTag(tag)}
                />
                {tag}
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="checkboxes" style={{ display: "inline-flex" }}>
            <input
              type="checkbox"
              checked={draft.featured}
              onChange={(e) => set("featured", e.target.checked)}
            />
            Featured on the home page
          </label>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={busy}>
            {busy ? "Saving…" : editingId ? "Save changes" : "Create store"}
          </button>
          {editingId && (
            <button type="button" className="secondary" onClick={onDone} disabled={busy}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
