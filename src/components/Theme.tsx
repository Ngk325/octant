import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  FN_COLOR, FN_GLOW, QUADRA_COLOR, CANVAS, easeColor, easeFill, onEaseFill, type Theme,
} from "../engine/palette";
import type { Fn } from "../engine/data";

const KEY = "stratfield.theme";

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

const systemTheme = (): Theme =>
  typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPref] = useState<Theme | null>(() => {
    try {
      const v = localStorage.getItem(KEY);
      return v === "light" || v === "dark" ? v : null;
    } catch {
      return null;
    }
  });
  const [system, setSystem] = useState<Theme>(systemTheme);

  useEffect(() => {
    if (typeof matchMedia !== "function") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const on = () => setSystem(mq.matches ? "dark" : "light");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const theme = preference ?? system;

  useEffect(() => {
    const root = document.documentElement;
    if (preference) root.dataset.theme = preference;
    else delete root.dataset.theme;
    try {
      if (preference) localStorage.setItem(KEY, preference);
      else localStorage.removeItem(KEY);
    } catch {
      /* private mode — the theme just will not persist */
    }
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

export function usePalette(): Ctx {
  const c = useContext(ThemeCtx);
  if (!c) throw new Error("usePalette must be used inside ThemeProvider");
  return c;
}
