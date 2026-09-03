import { useState, type FormEvent } from "react";
import { supabase } from "../supabase";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    // On success, App's auth listener swaps this view out.
    if (error) setError(error.message);
  }

  return (
    <div className="login-wrap">
      <div className="card">
        <h1 style={{ marginBottom: 4 }}>Admin sign in</h1>
        <p className="hint" style={{ marginTop: 0, marginBottom: 16 }}>
          SG Remote Food Order
        </p>
        {error && <div className="msg error">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" disabled={busy} style={{ width: "100%" }}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="hint" style={{ marginTop: 16 }}>
          Accounts are created by an admin in the Supabase dashboard. Public sign-ups
          are disabled.
        </p>
      </div>
    </div>
  );
}
