import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { DashboardProvider } from "../../hooks/useDashboard";
import TopNav from "./TopNav";
import SmoothScroll from "./SmoothScroll";
import { trackView } from "../../lib/uiEvents";

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
  const location = useLocation();

  // Site-wide page-view event, every route change - this is the one place
  // that fires for every page (not just the 3 instrumented ones), so it's
  // what backs the "unique daily users" rollup (see
  // backend/scripts/dailyUniqueUsers.js), which needs a signal for ANY
  // visit, not just Frameworks/Q&A/Guesstimates interactions.
  useEffect(() => {
    trackView(location.pathname, "page-view");
  }, [location]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const win = window as unknown as {
        dataLayer?: Array<Record<string, unknown>>;
        gtag?: (...args: unknown[]) => void;
      };
      if (typeof win.gtag === "function") {
        win.gtag("event", "page_view", {
          page_path: location.pathname + location.search,
          page_title: document.title
        });
      } else if (Array.isArray(win.dataLayer)) {
        win.dataLayer.push({
          event: "page_view",
          page_path: location.pathname + location.search,
          page_title: document.title
        });
      }
    }
  }, [location]);
  return (
    <DashboardProvider>
      <SmoothScroll />
      <div style={{ minHeight: "100vh", background: "transparent" }}>
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
