import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "[supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — fill in backend/.env before calling the API."
  );
}

// Falls back to a placeholder so the server can still boot (e.g. GET /health)
// before backend/.env is filled in. Any real query will fail until it's set.
export const supabase = createClient(
  process.env.SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key"
);
