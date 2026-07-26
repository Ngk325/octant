import type { Fn } from "./data";

export type Theme = "light" | "dark";

/* ------------------------------------------------------------------ *
 * A function keeps its HUE in every diagram, in both themes — but not
 * its lightness, because a colour tuned for near-black is unreadable on
 * paper. Every value below is checked against its own canvas in
 * tests/palette.test.ts, so nothing here can drift back into the
 * decorative-but-illegible range the first build shipped with.
 *
 * Hue families: N = violet, S = amber/brown, T = teal, F = rose.
 * Extraverted reads lighter; introverted reads deeper.
 * ------------------------------------------------------------------ */

export const CANVAS: Record<Theme, string> = {
  light: "#FDFCFA",
  dark: "#141310",
};

export const FN_COLOR: Record<Theme, Record<Fn, string>> = {
  light: {
    Ne: "#6B3BC4", Ni: "#4B2A8F",
    Se: "#8A5410", Si: "#6A4416",
    Te: "#0D6560", Ti: "#0A4A4E",
    Fe: "#AE3355", Fi: "#8A2543",
  },
  dark: {
    Ne: "#C9A0FF", Ni: "#9B7BE0",
    Se: "#FFC15E", Si: "#D19A5C",
    Te: "#5FE0D6", Ti: "#49B3AE",
    Fe: "#FF8FB0", Fi: "#E06A8E",
  },
};

export const FN_GLOW: Record<Theme, Record<Fn, string>> = {
  light: {
    Ne: "rgba(107,59,196,.20)", Ni: "rgba(75,42,143,.18)",
    Se: "rgba(138,84,16,.20)", Si: "rgba(106,68,22,.18)",
    Te: "rgba(13,101,96,.20)", Ti: "rgba(10,74,78,.18)",
    Fe: "rgba(174,51,85,.20)", Fi: "rgba(138,37,67,.18)",
  },
  dark: {
    Ne: "rgba(201,160,255,.45)", Ni: "rgba(155,123,224,.38)",
    Se: "rgba(255,193,94,.45)", Si: "rgba(209,154,92,.38)",
    Te: "rgba(95,224,214,.45)", Ti: "rgba(73,179,174,.38)",
    Fe: "rgba(255,143,176,.45)", Fi: "rgba(224,106,142,.38)",
  },
};

export const QUADRA_COLOR: Record<Theme, Record<string, string>> = {
  light: { Alpha: "#6B3BC4", Beta: "#AE3355", Gamma: "#0D6560", Delta: "#8A5410" },
  dark: { Alpha: "#C9A0FF", Beta: "#FF8FB0", Gamma: "#5FE0D6", Delta: "#FFC15E" },
};

/* ------------------------------- ease ------------------------------- */

type Stop = [number, [number, number, number]];

/** Text-safe ease colours: readable ON the canvas. */
const EASE_TEXT: Record<Theme, Stop[]> = {
  light: [
    [10, [170, 42, 30]], [40, [148, 84, 14]], [60, [116, 100, 18]],
    [80, [40, 106, 63]], [100, [15, 95, 70]],
  ],
  dark: [
    [10, [232, 122, 104]], [40, [220, 168, 104]], [60, [222, 208, 130]],
    [80, [150, 205, 162]], [100, [120, 214, 175]],
  ],
};

/** Fill colours for the matrix, where the swatch is the background. */
const EASE_FILL: Record<Theme, Stop[]> = {
  light: [
    [10, [248, 216, 210]], [40, [250, 231, 205]], [60, [246, 242, 205]],
    [80, [214, 238, 219]], [100, [196, 235, 218]],
  ],
  dark: [
    [10, [92, 40, 34]], [40, [92, 66, 30]], [60, [84, 80, 36]],
    [80, [40, 84, 58]], [100, [30, 82, 62]],
  ],
};

function ramp(stops: Stop[], v: number): string {
  if (v <= stops[0][0]) return `rgb(${stops[0][1].join(",")})`;
  for (let i = 1; i < stops.length; i++) {
    if (v <= stops[i][0]) {
      const [a, ca] = stops[i - 1], [b, cb] = stops[i];
      const k = (v - a) / (b - a);
      return `rgb(${ca.map((c, j) => Math.round(c + (cb[j] - c) * k)).join(",")})`;
    }
  }
  return `rgb(${stops[stops.length - 1][1].join(",")})`;
}

/** Red through amber to green, for ease values 0-100, readable as text. */
export const easeColor = (v: number, theme: Theme = "light"): string => ramp(EASE_TEXT[theme], v);

/** The same ramp as a background wash, for matrix cells. */
export const easeFill = (v: number, theme: Theme = "light"): string => ramp(EASE_FILL[theme], v);

/** Ink that stays readable on an `easeFill` swatch. */
export const onEaseFill = (theme: Theme): string => (theme === "light" ? "#211E19" : "#F2EEE6");

/* --------------------------- contrast maths --------------------------- */
/* Exported so the design system can be asserted rather than eyeballed. */

export function parseColor(c: string): [number, number, number] {
  const hex = c.trim();
  if (hex.startsWith("#")) {
    const h = hex.length === 4
      ? hex.slice(1).split("").map((ch) => ch + ch).join("")
      : hex.slice(1);
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
  }
  const m = hex.match(/rgba?\(([^)]+)\)/);
  if (!m) throw new Error(`Unparseable colour: ${c}`);
  const parts = m[1].split(",").map((n) => parseFloat(n));
  return [parts[0], parts[1], parts[2]];
}

const channel = (v: number) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

export function luminance(c: string): number {
  const [r, g, b] = parseColor(c);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 2.1 contrast ratio, 1–21. */
export function contrastRatio(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
