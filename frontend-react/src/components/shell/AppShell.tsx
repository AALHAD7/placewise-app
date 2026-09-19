import { Outlet } from "react-router-dom";
import { DashboardProvider } from "../../hooks/useDashboard";
import TopNav from "./TopNav";

// Ported from frontend/index.html lines 222-224, 294 - the app is
// deliberately desktop-only (1180px floor, see global.css's media query),
// not a migration side effect to "fix".
export default function AppShell() {
  return (
    <DashboardProvider>
      <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
        <div style={{ minWidth: 1180 }}>
          <TopNav />
          <main style={{ position: "relative", padding: "26px 44px 72px" }}>
            <Outlet />
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}
