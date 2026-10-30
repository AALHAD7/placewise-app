import { Outlet } from "react-router-dom";
import { DashboardProvider } from "../../hooks/useDashboard";
import TopNav from "./TopNav";
import SmoothScroll from "./SmoothScroll";

// Ported from frontend/index.html lines 222-224, 294. The former 1180px
// desktop-only floor (see git history) was a deliberate decision at the
// time - reversed per an explicit later spec requiring real responsiveness
// down to 375px and correct behavior at 50-200% browser zoom (P0 of the
// Home redesign). .app-container (global.css) caps and centers content at
// every width instead.
//
// The .app-shell class is the surface a modal pushes back (see the
// [data-modal] rule in global.css): a modal task dims and recedes the layer
// behind it instead of leaving both at the same depth. Modals themselves
// portal to <body> so the shell's transform never becomes their containing
// block.
export default function AppShell() {
  return (
    <DashboardProvider>
      <SmoothScroll />
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <div className="app-shell" data-modal="false">
          <TopNav />
          <main style={{ position: "relative" }}>
            <div className="app-container" style={{ paddingTop: "1.625rem", paddingBottom: "4.5rem" }}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}
