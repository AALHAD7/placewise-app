import { useEffect, useRef, useState } from "react";

// For a loading state with no real completion signal to read (a single
// non-streaming AI call, unlike Resume's interrogation which streams real
// per-question progress - see apiClient.ts's streamInterrogate) - ramps a
// percentage toward `cap` on an easing curve calibrated to how long the
// call actually tends to take, rather than a bare spinner. `tauMs` is the
// time constant: roughly 63% of the way to `cap` by `tauMs`, still visibly
// creeping (not stalled dead) well past it for the slow-tail cases instead
// of parking at a number that looks finished. Never claims 100% - only the
// real loading=false transition does that, by the loading UI going away.
export function useSimulatedProgress(loading: boolean, tauMs = 6000, cap = 92): number {
  const [percent, setPercent] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!loading) {
      setPercent(0);
      startRef.current = null;
      return;
    }
    startRef.current = Date.now();
    setPercent(1);
    const id = setInterval(() => {
      const elapsed = Date.now() - (startRef.current as number);
      setPercent(Math.max(1, Math.round(cap * (1 - Math.exp(-elapsed / tauMs)))));
    }, 150);
    return () => clearInterval(id);
  }, [loading, tauMs, cap]);

  return percent;
}
