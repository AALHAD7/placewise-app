import { useEffect, useRef, useState } from "react";

// Keeps a conditionally-rendered surface mounted for the length of its exit
// animation, so it can leave along the same path it arrived on. Without
// this, React unmounts on the state flip and a panel that *enters* as a
// material just disappears on a single frame - an asymmetry that reads as a
// glitch rather than as the thing going back where it came from.
//
// Returns `rendered` (mount the surface at all) and `exiting` (swap the
// -in class for its mirrored -out class). Honours prefers-reduced-motion by
// collapsing the exit to an immediate unmount.
export function useExitTransition(open: boolean, durationMs = 200) {
  const [rendered, setRendered] = useState(open);
  const [exiting, setExiting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (open) {
      setRendered(true);
      setExiting(false);
      return;
    }
    if (!rendered) return;
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setRendered(false);
      setExiting(false);
      return;
    }
    setExiting(true);
    timer.current = setTimeout(() => {
      setRendered(false);
      setExiting(false);
    }, durationMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [open, rendered, durationMs]);

  return { rendered, exiting };
}
