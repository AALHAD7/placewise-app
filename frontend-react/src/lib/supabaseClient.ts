import { createClient } from "@supabase/supabase-js";

// Same Supabase project as backend/.env's SUPABASE_URL - this key is the
// "anon" / "public" one (Project Settings -> API), safe to ship in frontend
// code. Row Level Security and the backend's own requireAuth/optionalAuth
// checks are what actually protect data, not keeping this key secret.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Fails loudly at startup rather than letting every auth call fail with a
  // confusing network error - see frontend-react/.env.example.
  console.error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY - copy frontend-react/.env.example to .env and fill them in."
  );
}

// persistSession (default true) keeps the session in localStorage across
// reloads; autoRefreshToken (default true) refreshes it before it expires.
// Both are exactly what every page here already assumes a session behaves
// like, so no extra config needed.
export const supabase = createClient(url || "", anonKey || "");
