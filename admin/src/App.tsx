import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { Login } from "./components/Login";
import { StoreForm } from "./components/StoreForm";
import { StoreList } from "./components/StoreList";
import type { ServiceTag, StoreRecord } from "./types";

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
  const [editing, setEditing] = useState<StoreRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    const { data, error } = await supabase
      .from("stores")
      .select(
        "id, slug, name, type, description, cuisine, region, address, order_url, app_ios_url, app_android_url, featured, store_tags(tag)",
      )
      .order("name");
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    const rows: StoreRecord[] = (data ?? []).map((r) => {
      const { store_tags, ...rest } = r as typeof r & {
        store_tags: { tag: ServiceTag }[] | null;
      };
      return { ...rest, tags: (store_tags ?? []).map((t) => t.tag) } as StoreRecord;
    });
    setStores(rows);
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

      <StoreForm key={editing?.id ?? "new"} initial={editing} onDone={onDone} />

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
