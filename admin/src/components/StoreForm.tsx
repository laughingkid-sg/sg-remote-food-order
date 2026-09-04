import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../supabase";
import { Combobox } from "./Combobox";
import { SelectMenu } from "./SelectMenu";
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

const LOGO_BUCKET = "store-logos";
const MAX_LOGO_SIZE = 5 * 1024 * 1024;
const LOGO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function logoExtension(file: File): string {
  return file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
}

function storagePathFromPublicUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const marker = `/storage/v1/object/public/${LOGO_BUCKET}/`;
    const pathname = new URL(url).pathname;
    return pathname.startsWith(marker)
      ? decodeURIComponent(pathname.slice(marker.length))
      : null;
  } catch {
    return null;
  }
}

/** Turn "" into null for nullable columns. */
function orNull(v: string): string | null {
  const t = v.trim();
  return t === "" ? null : t;
}

/** Lowercase, non-alphanumerics → single hyphens, trimmed. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Suggest a slug from the name, appending the area unless it's already there
 *  (names often already include the branch, e.g. "Kopitiam Toast — Tampines"). */
function suggestSlug(name: string, area: string | null): string {
  const base = slugify(name);
  const areaSlug = area ? slugify(area) : "";
  return areaSlug && !base.includes(areaSlug) ? `${base}-${areaSlug}` : base;
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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [clearLogo, setClearLogo] = useState(false);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(
    initial?.logo_url ?? null,
  );
  // Once the user edits the slug (or when editing an existing store), stop
  // auto-suggesting so we never rewrite a live URL.
  const [slugEdited, setSlugEdited] = useState(editingId !== null);

  // Auto-suggest the slug from name + area for new, untouched stores.
  useEffect(() => {
    if (slugEdited) return;
    setDraft((d) => ({ ...d, slug: suggestSlug(d.name, d.area) }));
  }, [draft.name, draft.area, slugEdited]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl(clearLogo ? null : draft.logo_url);
      return;
    }
    const previewUrl = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [clearLogo, draft.logo_url, logoFile]);

  function set<K extends keyof StoreDraft>(key: K, value: StoreDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function toggleTag(tag: ServiceTag) {
    setDraft((d) => ({
      ...d,
      tags: d.tags.includes(tag) ? d.tags.filter((t) => t !== tag) : [...d.tags, tag],
    }));
  }

  function onLogoChange(file: File | undefined) {
    setError(null);
    if (!file) {
      setLogoFile(null);
      return;
    }
    if (!LOGO_TYPES.has(file.type)) {
      setError("Logo must be a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      setError("Logo must be 5 MB or smaller.");
      return;
    }
    setClearLogo(false);
    setLogoFile(file);
  }

  // Merged region → area picker. Areas grouped by region (from the areas table).
  const areasByRegion = new Map<RegionSlug, Area[]>();
  for (const a of areas) {
    const arr = areasByRegion.get(a.region) ?? [];
    arr.push(a);
    areasByRegion.set(a.region, arr);
  }

  const locationValue =
    draft.region === null
      ? "none"
      : draft.area
        ? `a:${draft.region}|${draft.area}`
        : `r:${draft.region}`;

  function onLocationChange(v: string) {
    if (v === "none") {
      setDraft((d) => ({ ...d, region: null, area: "" }));
    } else if (v.startsWith("a:")) {
      const [r, name] = v.slice(2).split("|");
      setDraft((d) => ({ ...d, region: r as RegionSlug, area: name }));
    } else {
      setDraft((d) => ({ ...d, region: v.slice(2) as RegionSlug, area: "" }));
    }
  }

  /** Friendly client-side validation, mirroring the DB constraints. */
  function validate(): string | null {
    if (!draft.name.trim()) return "Name is required.";
    const slug = draft.slug.trim();
    if (!slug) return "Slug is required.";
    if (!/^[a-z0-9-]+$/.test(slug))
      return "Slug can only contain lowercase letters, numbers and hyphens.";
    if (draft.type === "qr" && !draft.region)
      return "A location is required for order-link stores.";
    if (draft.type === "qr" && !(draft.order_url ?? "").trim())
      return "An Order URL is required for order-link stores.";
    if (
      draft.type === "app" &&
      !(draft.app_ios_url ?? "").trim() &&
      !(draft.app_android_url ?? "").trim()
    )
      return "App stores need at least one download link (iOS or Android).";
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setError(null);
    setBusy(true);

    const cuisine = Array.from(
      new Map(
        draft.cuisine
          .map((name) => name.trim())
          .filter(Boolean)
          .map((name) => [name.toLowerCase(), name]),
      ).values(),
    );
    const row = {
      slug: draft.slug.trim(),
      name: draft.name.trim(),
      type: draft.type,
      description: draft.description.trim(),
      cuisine,
      logo_url: clearLogo ? null : draft.logo_url,
      region: draft.region,
      area: orNull(draft.area ?? ""),
      address: orNull(draft.address ?? ""),
      postal_code: orNull(draft.postal_code ?? ""),
      order_url: draft.type === "qr" ? orNull(draft.order_url ?? "") : null,
      app_ios_url: draft.type === "app" ? orNull(draft.app_ios_url ?? "") : null,
      app_android_url: draft.type === "app" ? orNull(draft.app_android_url ?? "") : null,
      featured: draft.featured,
    };

    // Persist each brand-new cuisine into the vocabulary so it becomes a default.
    const existingCuisineNames = new Set(cuisines.map((c) => c.name.toLowerCase()));
    const newCuisineNames = cuisine.filter((name) => !existingCuisineNames.has(name.toLowerCase()));
    if (newCuisineNames.length > 0) {
      const { error } = await supabase
        .from("cuisines")
        .insert(newCuisineNames.map((name) => ({ name })));
      if (error) return fail(error.message);
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

    const previousLogoPath = storagePathFromPublicUrl(draft.logo_url);
    if (logoFile) {
      const logoPath = `stores/${storeId}/${crypto.randomUUID()}.${logoExtension(logoFile)}`;
      const { error: uploadError } = await supabase.storage
        .from(LOGO_BUCKET)
        .upload(logoPath, logoFile, {
          contentType: logoFile.type,
          cacheControl: "31536000",
        });
      if (uploadError) return fail(uploadError.message);

      const { data: publicUrlData } = supabase.storage
        .from(LOGO_BUCKET)
        .getPublicUrl(logoPath);
      const { error: logoUpdateError } = await supabase
        .from("stores")
        .update({ logo_url: publicUrlData.publicUrl })
        .eq("id", storeId!);
      if (logoUpdateError) return fail(logoUpdateError.message);
    }

    if (clearLogo && !logoFile) {
      const { error: logoUpdateError } = await supabase
        .from("stores")
        .update({ logo_url: null })
        .eq("id", storeId!);
      if (logoUpdateError) return fail(logoUpdateError.message);
    }

    if (previousLogoPath && (logoFile || clearLogo)) {
      await supabase.storage.from(LOGO_BUCKET).remove([previousLogoPath]);
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
            <SelectMenu
              id="type"
              value={draft.type}
              onChange={(v) => {
                const t = v as StoreType;
                setDraft((d) => ({
                  ...d,
                  type: t,
                  // Apps are brand-wide → clear location; order-link needs one.
                  ...(t === "app"
                    ? { region: null, area: "" }
                    : d.region === null
                      ? { region: "central", area: "" }
                      : {}),
                }));
              }}
              ariaLabel="Type"
              groups={[
                {
                  label: null,
                  options: [
                    { value: "qr", label: "Order Link (per branch)" },
                    { value: "app", label: "App (download links)" },
                  ],
                },
              ]}
            />
          </div>
          <div className="field">
            <label htmlFor="location">
              Location {draft.type === "qr" && <Req />}{" "}
              <span className="hint">— region › area</span>
            </label>
            <SelectMenu
              id="location"
              value={locationValue}
              onChange={onLocationChange}
              ariaLabel="Location"
              groups={[
                // Nationwide is only valid for brand-wide app stores.
                ...(draft.type === "app"
                  ? [
                      {
                        label: null,
                        options: [{ value: "none", label: "Nationwide (no region)" }],
                      },
                    ]
                  : []),
                ...REGIONS.map((r) => ({
                  label: r.name,
                  options: [
                    { value: `r:${r.slug}`, label: `${r.name} (Others)` },
                    ...(areasByRegion.get(r.slug) ?? []).map((a) => ({
                      value: `a:${r.slug}|${a.name}`,
                      label: a.name,
                    })),
                  ],
                })),
              ]}
            />
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
              Slug <Req />{" "}
              <span className="hint">
                — {editingId ? "URL id" : "auto-suggested; edit to override"}
              </span>
            </label>
            <input
              id="slug"
              type="text"
              value={draft.slug}
              onChange={(e) => {
                setSlugEdited(true);
                set("slug", e.target.value);
              }}
              pattern="[a-z0-9-]+"
              required
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="cuisine">
            Cuisines <span className="hint">— select one or more, or add a new one</span>
          </label>
          <Combobox
            id="cuisine"
            value={draft.cuisine}
            onChange={(v) => set("cuisine", v)}
            options={cuisines.map((c) => c.name)}
            placeholder="e.g. Local, Japanese…"
          />
        </div>

        <div className="row">
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
            <label htmlFor="postal">
              Postal code <span className="hint">— 6 digits</span>
            </label>
            <input
              id="postal"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={draft.postal_code ?? ""}
              onChange={(e) => set("postal_code", e.target.value)}
              placeholder="e.g. 529510"
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="logo">
            Logo image <span className="hint">— optional; JPG, PNG, or WebP up to 5 MB</span>
          </label>
          <div className="logo-upload">
            {logoPreviewUrl && (
              <img className="logo-preview" src={logoPreviewUrl} alt="Logo preview" />
            )}
            <div>
              <input
                id="logo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => onLogoChange(e.target.files?.[0])}
              />
              {logoFile && <p className="hint">Selected: {logoFile.name}</p>}
              {draft.logo_url && !logoFile && !clearLogo && (
                <button
                  type="button"
                  className="link"
                  onClick={() => setClearLogo(true)}
                >
                  Remove current logo
                </button>
              )}
              {clearLogo && !logoFile && (
                <button
                  type="button"
                  className="link"
                  onClick={() => setClearLogo(false)}
                >
                  Keep current logo
                </button>
              )}
            </div>
          </div>
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
