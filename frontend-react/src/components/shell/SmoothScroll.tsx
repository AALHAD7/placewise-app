import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";

// Mounted once inside AppShell (persists across in-app navigation - only the
// routed <Outlet/> content swaps, AppShell itself never unmounts). Renders
// nothing; it only lifts wheel/trackpad scrolling out of native instant
// scroll into Lenis's eased animation loop for every page under the shell.
export default function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const lenis = new Lenis({ autoRaf: true });
    lenisRef.current = lenis;
    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    // React Router doesn't reset scroll position on client-side navigation,
    // and Lenis (not the browser) now owns the actual scroll offset - without
    // this, navigating to a new page keeps the previous page's scroll spot
    // instead of starting at the top like a normal page load would.
    lenisRef.current?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return null;
}
