import { useEffect, useRef, useState } from "react";

/**
 * The rendered width of an element, tracked through resizes.
 *
 * For components that must change SHAPE below a width rather than merely
 * scale — the octagram wheel redraws itself on a tall canvas when its column
 * is narrow, because scaling its wide canvas down turns 14px labels into 6px
 * ones. A media query cannot answer "how wide is my column" (the same
 * viewport gives different columns with the chat rail open or closed), so
 * this measures the element itself.
 *
 * Returns null until the first measurement; callers pick a sensible guess
 * for that one frame.
 */
export default function useMeasuredWidth<T extends HTMLElement>(): {
  ref: React.RefObject<T | null>;
  width: number | null;
} {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (typeof w === "number") setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, width };
}
