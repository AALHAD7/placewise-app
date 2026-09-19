import { supabase } from "../lib/supabase.js";

// Validates a Supabase-issued JWT (the frontend gets this from supabase.auth
// after login/signup) against the Supabase Auth server and attaches the user
// to the request. Endpoints marked "Auth: Required" in the API spec use this.
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing Authorization: Bearer <token> header." });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }

  req.user = data.user;
  next();
}

// For endpoints marked "Auth: Optional" — attaches req.user if a valid token
// is present, but never blocks the request.
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token) {
    const { data } = await supabase.auth.getUser(token);
    if (data?.user) req.user = data.user;
  }

  next();
}
