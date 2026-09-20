import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

// Gates every route except /login. A session includes a guest (anonymous)
// one, so "logged in" here just means "picked a way in" - email, Google, or
// guest - matching the product ask: browsing/using the app always happens
// under some session, never anonymous-to-the-backend.
export default function RequireAuth() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", fontSize: 13.5 }}>
        Loading…
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
