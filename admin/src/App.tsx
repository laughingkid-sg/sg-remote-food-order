import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { Login } from "./components/Login";
import { StoreForm } from "./components/StoreForm";
import { StoreList } from "./components/StoreList";
import type { Area, Cuisine, ServiceTag, StoreRecord } from "./types";

function normaliseCuisine(cuisine: string[] | string | null): string[] {
  const values = Array.isArray(cuisine) ? cuisine : cuisine?.split(/\s*-\s*/) ?? [];
  return values.map((value) => value.trim()).filter(Boolean);
}

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!authReady) {
    return <div className="container">Loading…</div>;
  }

  return session ? <Dashboard email={session.user.email ?? ""} /> : <Login />;
}

function Dashboard({ email }: { email: string }) {
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [editing, setEditing] = useState<StoreRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    const [storesRes, cuisinesRes, areasRes] = await Promise.all([
      supabase
        .from("stores")
        .select(
          "id, slug, name, type, description, cuisine, logo_url, region, area, address, postal_code, order_url, app_ios_url, app_android_url, featured, store_tags(tag)",
        )
        .order("name"),
      supabase.from("cuisines").select("id, name").order("name"),
      supabase.from("areas").select("id, name, region").order("name"),
    ]);
    setLoading(false);
    if (storesRes.error) {
      setError(storesRes.error.message);
      return;
    }
    const rows: StoreRecord[] = (storesRes.data ?? []).map((r) => {
      const { store_tags, ...rest } = r as typeof r & {
        store_tags: { tag: ServiceTag }[] | null;
      };
      return {
        ...rest,
        cuisine: normaliseCuisine(rest.cuisine),
        tags: (store_tags ?? []).map((t) => t.tag),
      } as StoreRecord;
    });
    setStores(rows);
    if (!cuisinesRes.error) setCuisines((cuisinesRes.data ?? []) as Cuisine[]);
    if (!areasRes.error) setAreas((areasRes.data ?? []) as Area[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function onDone() {
    setEditing(null);
    void load();
  }

  return (
    <div className="container">
      <div className="topbar">
        <h1>🍜 Food Order · Admin</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="hint">{email}</span>
          <button className="secondary" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </div>
      </div>

      <StoreForm
        key={editing?.id ?? "new"}
        initial={editing}
        cuisines={cuisines}
        areas={areas}
        onDone={onDone}
      />

      <h2>Stores {stores.length > 0 && `(${stores.length})`}</h2>
      {error && <div className="msg error">{error}</div>}
      {loading ? (
        <p className="hint">Loading…</p>
      ) : (
        <StoreList stores={stores} onEdit={setEditing} onChanged={load} />
      )}
    </div>
  );
}
