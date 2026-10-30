import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";

// Mounted once inside AppShell (persists across in-app navigation - only the
// routed <Outlet/> content swaps, AppShell itself never unmounts). Renders
// nothing; it only lifts wheel/trackpad scrolling out of native instant
// scroll into Lenis's eased animation loop for every page under the shell.
// Belt-and-braces alongside lenis.stop()/start() below - confirmed live
// (screenshot: page content visibly scrolled behind an open modal) that
// lenis.stop() alone isn't enough. Lenis's stop() pauses its own virtual
// scroll loop, but stops short of calling preventDefault() on the
// underlying wheel/touch events too, so once it steps aside the browser's
// native document scroll - which was there all along under Lenis's
// hijacking - takes wheel/trackpad input again and moves the real page.
// Locking overflow directly on the actual scrolling element removes that
// path entirely, independent of whatever Lenis's internals do on stop().
function setNativeScrollLocked(locked: boolean) {
  document.documentElement.style.overflow = locked ? "hidden" : "";
}

export default function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const lenis = new Lenis({ autoRaf: true });
    lenisRef.current = lenis;

    // Lenis hijacks wheel/touch scroll at the document level, so with a
    // modal open (a scrim + a centered panel with its own overflow:auto
    // content) scrolling over the modal was still driving Lenis's virtual
    // scroll on the page underneath instead of the modal's own content -
    // exactly the "I can scroll the page behind the modal" bug reported
    // live. Every modal in the app already flags .app-shell[data-modal] for
    // the push-back visual effect (see ResumePage/CompanyPage), so this
    // reuses that same signal as the single place to pause/resume Lenis,
    // rather than each modal needing its own scroll-lock logic.
    const shell = document.querySelector<HTMLElement>(".app-shell");
    let wasModal = shell?.dataset.modal === "true";
    if (wasModal) { lenis.stop(); setNativeScrollLocked(true); }
    const observer = shell
      ? new MutationObserver(() => {
          const isModal = shell.dataset.modal === "true";
          if (isModal === wasModal) return;
          wasModal = isModal;
          if (isModal) { lenis.stop(); setNativeScrollLocked(true); }
          else { lenis.start(); setNativeScrollLocked(false); }
        })
      : null;
    observer?.observe(shell!, { attributes: true, attributeFilter: ["data-modal"] });

    return () => {
      observer?.disconnect();
      lenis.destroy();
      setNativeScrollLocked(false);
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
