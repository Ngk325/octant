import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  FN_COLOR, FN_GLOW, QUADRA_COLOR, CANVAS, easeColor, easeFill, onEaseFill, type Theme,
} from "../engine/palette";
import type { Fn } from "../engine/data";
import { readStored, writeStored, removeStored } from "../storage";

const KEY = "theme";

interface Ctx {
  theme: Theme;
  /** null means "follow the operating system". */
  preference: Theme | null;
  setPreference(t: Theme | null): void;
  toggle(): void;
  fn(f: Fn): string;
  glow(f: Fn): string;
  quadra(q: string): string;
  ease(v: number): string;
  fill(v: number): string;
  onFill: string;
  canvas: string;
}

const ThemeCtx = createContext<Ctx | null>(null);

/** What the operating system currently prefers. Used when there is no stored choice. */
const systemTheme = (): Theme =>
  typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

/**
 * Resolves light or dark, keeps `data-theme` in sync, and exposes the palette to any
 * component that needs literal colour values.
 *
 * THE COLOUR CONVENTION FOR DIAGRAMS, written down because every new diagram
 * must follow it and it was previously tribal knowledge:
 *
 *   - SEMANTIC colour — a function's hue, a quadra's dot, the ease ramp —
 *     comes from usePalette() as literal hex. These values are per-theme
 *     records in engine/palette.ts, asserted against WCAG AA in
 *     tests/palette.test.ts, and there is no CSS variable for them.
 *   - CHROME — rules, muted text, surfaces, the accent — is written as CSS
 *     custom properties directly in SVG attributes (fill="var(--muted)").
 *     Inline SVG resolves var() like any other element, and both paths flip
 *     together when data-theme changes.
 *
 * Use the right path for the right kind of colour: palette hex where the
 * colour MEANS something, var() where it is furniture.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPref] = useState<Theme | null>(() => {
    try {
      const v = readStored(KEY);
      return v === "light" || v === "dark" ? v : null;
    } catch {
      return null;
    }
  });
  const [system, setSystem] = useState<Theme>(systemTheme);

  useEffect(() => {
    if (typeof matchMedia !== "function") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    /** Re-read the OS preference when it changes under us. */
    const on = () => setSystem(mq.matches ? "dark" : "light");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const theme = preference ?? system;

  /* data-theme always carries the RESOLVED theme, never "unset for system".
     tokens.css declares the dark palette once, under [data-theme="dark"], so
     following the system means writing the system's answer here rather than
     leaving the attribute off and relying on a duplicate media block. */
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (preference) writeStored(KEY, preference);
    else removeStored(KEY);
  }, [preference]);

  const setPreference = useCallback((t: Theme | null) => setPref(t), []);
  const toggle = useCallback(
    () => setPref((p) => ((p ?? systemTheme()) === "dark" ? "light" : "dark")),
    [],
  );

  const value = useMemo<Ctx>(
    () => ({
      theme,
      preference,
      setPreference,
      toggle,
      fn: (f) => FN_COLOR[theme][f],
      glow: (f) => FN_GLOW[theme][f],
      quadra: (q) => QUADRA_COLOR[theme][q] ?? "var(--muted)",
      ease: (v) => easeColor(v, theme),
      fill: (v) => easeFill(v, theme),
      onFill: onEaseFill(theme),
      canvas: CANVAS[theme],
    }),
    [theme, preference, setPreference, toggle],
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

/** The resolved theme and its colour accessors. Throws outside a ThemeProvider. */
export function usePalette(): Ctx {
  const c = useContext(ThemeCtx);
  if (!c) throw new Error("usePalette must be used inside ThemeProvider");
  return c;
}
