import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { errorDetail } from "../lib/errors.js";
import { devLoginLimiter } from "../middleware/rateLimit.js";

const router = Router();

// DEV/TEST ONLY. Hands out a valid Supabase session for a fixed local test
// account with no credentials required, so the frontend can be smoke-tested
// against auth-protected endpoints before a real login screen exists.
// This is an intentional auth bypass — it must never be reachable in
// production. Remove this route entirely once real login exists on the
// frontend.
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

router.post("/test-login", devLoginLimiter, async (req, res) => {
  if (process.env.NODE_ENV === "production" || process.env.ENABLE_DEV_LOGIN !== "true") {
    return res.status(404).end();
  }

  try {
    let signIn = await supabase.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD });
    if (signIn.error) {
      const created = await supabase.auth.admin.createUser({ email: TEST_EMAIL, password: TEST_PASSWORD, email_confirm: true });
      if (created.error) throw created.error;
      signIn = await supabase.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD });
      if (signIn.error) throw signIn.error;
    }
    res.json({ access_token: signIn.data.session.access_token });
  } catch (err) {
    console.error("[dev/test-login]", err);
    res.status(500).json({ error: "Failed to issue dev test token.", detail: errorDetail(err) });
  }
});

export default router;
