// Centralizes what an error response is allowed to reveal. Every route was
// unconditionally echoing `err.message` back to the client, which can leak
// internal detail (library internals, file paths, provider error bodies) to
// anyone who can trigger a failure — fine in local dev, not fine once this is
// public. In production the client gets a generic message and the real
// detail only goes to the server log via the route's own console.error.
export function errorDetail(err) {
  return process.env.NODE_ENV === "production" ? undefined : err?.message;
}
