import { Outlet } from "react-router-dom";
import { DashboardProvider } from "../../hooks/useDashboard";
import TopNav from "./TopNav";

// Ported from frontend/index.html lines 222-224, 294 - the app is
// deliberately desktop-only (1180px floor, see global.css's media query),
// not a migration side effect to "fix".
//
// The .app-shell class is the surface a modal pushes back (see the
// [data-modal] rule in global.css): a modal task dims and recedes the layer
// behind it instead of leaving both at the same depth. Modals themselves
// portal to <body> so the shell's transform never becomes their containing
// block.
export default function AppShell() {
  return (
    <DashboardProvider>
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <div className="app-shell" data-modal="false" style={{ minWidth: 1180 }}>
          <TopNav />
          <main style={{ position: "relative", padding: "26px 44px 72px" }}>
            <Outlet />
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}
