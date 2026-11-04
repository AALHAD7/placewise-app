import { useEffect, useRef } from "react";

// Shared by every dropdown on the site (Selector.tsx, Tone Shifter's
// LabeledDropdown and its inline unit picker) - closes the dropdown the
// instant a click lands anywhere outside it, instead of only closing on a
// second click of the trigger or on picking an option. `active` gates the
// listener so it's only attached while the dropdown is actually open (no
// listener, no cost, while closed).
export function useOutsideClick<T extends HTMLElement>(active: boolean, onOutside: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!active) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    // mousedown catches the click a frame earlier than "click" would, so the
    // dropdown is already gone by the time a fast double-click or the next
    // element's own click handler runs. Clicking the trigger button again
    // is unaffected - it's inside `ref` (which wraps trigger + panel), so
    // `contains` is true there and the trigger's own toggle still runs.
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [active, onOutside]);
  return ref;
}
