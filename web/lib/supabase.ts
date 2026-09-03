import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Returns a Supabase client if the env vars are configured, otherwise null.
 *  The data layer falls back to local seed data when this is null, so the site
 *  builds and runs before a Supabase project exists. */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}
