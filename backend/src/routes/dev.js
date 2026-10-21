import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase.js";
import { errorDetail } from "../lib/errors.js";
import { devLoginLimiter } from "../middleware/rateLimit.js";

const router = Router();

// DEV/TEST ONLY. Hands out a valid Supabase session for a fixed local test
// account with no credentials required. The frontend has a real login screen
// now (Google / email-password / anonymous guest, see LoginPage.tsx +
// contexts/AuthContext.tsx) and no longer calls this route — its only
// remaining consumer is backend/test/api.test.js, which needs some way to
// get an authenticated token for its own requests without going through a
// browser-based OAuth flow. Kept rather than deleted for that reason, but
// still an intentional auth bypass that must never be reachable in
// production.
//
// Two independent gates, both required: NODE_ENV !== "production", AND
// ENABLE_DEV_LOGIN=true explicitly set. A single misconfigured/missing
// NODE_ENV on the host (e.g. forgotten in a Render env group) used to be
// the only thing standing between this route and a live production
// deployment — one bad env var away from handing any anonymous caller a
// valid signed session. ENABLE_DEV_LOGIN defaults to unset/false, so the
// route is off by default even if NODE_ENV is ever wrong; deliberately
// enabling it is a second, separate action from deploying at all.
const TEST_EMAIL = "dev-test@placementmasteryhub.local";
const TEST_PASSWORD = "dev-test-local-only-12345!";

// Sign in on a throwaway client, never on the shared service-role client: supabase-js
// stores the signed-in session on the client it was called on and then sends the USER's
// JWT on every later query, so signing in on lib/supabase.js silently turned every
// subsequent server query in that process into an RLS-bound dev-user query (found in
// R5: the service-role-only ingest_* tables read back empty after a dev login).
function signInClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

router.post("/test-login", devLoginLimiter, async (req, res) => {
  if (process.env.NODE_ENV === "production" || process.env.ENABLE_DEV_LOGIN !== "true") {
    return res.status(404).end();
  }

  try {
    const authClient = signInClient();
    let signIn = await authClient.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD });
    if (signIn.error) {
      const created = await supabase.auth.admin.createUser({ email: TEST_EMAIL, password: TEST_PASSWORD, email_confirm: true });
      if (created.error) throw created.error;
      signIn = await authClient.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD });
      if (signIn.error) throw signIn.error;
    }
    res.json({ access_token: signIn.data.session.access_token });
  } catch (err) {
    console.error("[dev/test-login]", err);
    res.status(500).json({ error: "Failed to issue dev test token.", detail: errorDetail(err) });
  }
});

export default router;
