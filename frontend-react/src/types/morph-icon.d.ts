// <morph-icon> is registered as a real custom element in index.html (see
// defineMorphIcon() there) - this just tells JSX/TS its shape so TSX files
// can use it as a plain intrinsic element.
import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "morph-icon": DetailedHTMLProps<HTMLAttributes<HTMLElement> & { icon?: string }, HTMLElement>;
    }
  }
}

export {};
