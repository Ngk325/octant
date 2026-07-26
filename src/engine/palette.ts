import type { Fn } from "./data";

/** Fixed spectral palette. A function keeps its hue in every diagram, everywhere.
 *  Extraverted functions render radiant; introverted functions render deep. */
export const FN_COLOR: Record<Fn, string> = {
  Ne: "#C9A0FF", Ni: "#7658C4",
  Se: "#FFC15E", Si: "#B37B3C",
  Te: "#5FE0D6", Ti: "#2F8890",
  Fe: "#FF8FB0", Fi: "#B4476C",
};
export const FN_GLOW: Record<Fn, string> = {
  Ne: "rgba(201,160,255,.55)", Ni: "rgba(118,88,196,.45)",
  Se: "rgba(255,193,94,.55)",  Si: "rgba(179,123,60,.45)",
  Te: "rgba(95,224,214,.55)",  Ti: "rgba(47,136,144,.45)",
  Fe: "rgba(255,143,176,.55)", Fi: "rgba(180,71,108,.45)",
};

/** Red through amber to green, for ease values 0-100. */
export function easeColor(v: number): string {
  const stops: [number, [number, number, number]][] = [
    [10, [214, 106, 88]], [40, [201, 150, 90]], [60, [206, 191, 116]],
    [80, [140, 190, 150]], [100, [110, 196, 160]],
  ];
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

export const QUADRA_COLOR: Record<string, string> = {
  Alpha: "#C9A0FF", Beta: "#FF8FB0", Gamma: "#5FE0D6", Delta: "#FFC15E",
};
