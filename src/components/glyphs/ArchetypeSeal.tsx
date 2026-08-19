import type { ReactNode } from "react";
import { stack, type MbtiType } from "../../engine/core";
import { ARCHETYPE } from "../../engine/data";
import { usePalette } from "../Theme";

/**
 * One seal per Wiring — the deck's archetype emblem (src/cards/art.ts,
 * emblem), home in the app. A sigil for the card's own ARCHETYPE names,
 * drawn from this system and no other: the Prospector's seams fanning
 * from one strike, the Watchman's tower on the horizon, the Keeper's
 * key. All sixteen are original figures keyed to the archetype table in
 * engine/data.ts, drawn bold in ink with the Lead's hue as the accent,
 * and fully deterministic — the same Wiring stamps the same seal
 * everywhere: page header, tile, welcome mat, and the printed card.
 */
export default function ArchetypeSeal({ type, size = 64 }: {
  type: MbtiType;
  size?: number;
}) {
  const p = usePalette();
  const c = p.fn(stack(type)[0]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      role="img"
      aria-label={`The ${ARCHETYPE[type][0]} — ${type}'s seal`}
      style={{ display: "block", flex: "0 0 auto" }}
    >
      <circle cx="30" cy="30" r="28" fill="none" stroke="var(--ink)" strokeWidth="1.3" strokeOpacity="0.75" />
      <Emblem t={type} cx={30} cy={30} s={21} c={c} />
    </svg>
  );
}

/** The sixteen figures, verbatim geometry from the deck. */
function Emblem({ t, cx, cy, s, c }: { t: MbtiType; cx: number; cy: number; s: number; c: string }) {
  const X = (px: number) => cx + px * s;
  const Y = (py: number) => cy + py * s;
  const w = s * 0.095;
  const M = (px: number, py: number) => `M ${X(px)} ${Y(py)}`;
  const L = (px: number, py: number) => `L ${X(px)} ${Y(py)}`;
  const Q = (qx: number, qy: number, px: number, py: number) => `Q ${X(qx)} ${Y(qy)} ${X(px)} ${Y(py)}`;

  /* Each helper stamps its own key — the pieces are a static list per type. */
  let k = 0;
  const st = (d: string, o = 1, ww = 1) => (
    <path key={k++} d={d} fill="none" stroke="var(--ink)" strokeWidth={w * ww} strokeOpacity={0.82 * o} strokeLinecap="round" strokeLinejoin="round" />
  );
  const hu = (d: string, ww = 1) => (
    <path key={k++} d={d} fill="none" stroke={c} strokeWidth={w * ww} strokeOpacity={0.9} strokeLinecap="round" strokeLinejoin="round" />
  );
  const hueFill = (d: string, o = 1) => <path key={k++} d={d} fill={c} fillOpacity={0.88 * o} />;
  const inkFill = (d: string, o = 1) => <path key={k++} d={d} fill="var(--ink)" fillOpacity={0.78 * o} />;
  const hueDot = (px: number, py: number, pr: number) => <circle key={k++} cx={X(px)} cy={Y(py)} r={pr * s} fill={c} fillOpacity={0.9} />;
  const inkDot = (px: number, py: number, pr: number) => <circle key={k++} cx={X(px)} cy={Y(py)} r={pr * s} fill="var(--ink)" fillOpacity={0.8} />;
  const inkRing = (px: number, py: number, pr: number, ww = 1) => (
    <circle key={k++} cx={X(px)} cy={Y(py)} r={pr * s} fill="none" stroke="var(--ink)" strokeWidth={w * ww} strokeOpacity={0.8} />
  );
  const dia = (px: number, py: number, d: number) => hueFill(M(px, py - d) + L(px + d, py) + L(px, py + d) + L(px - d, py) + "Z");
  const pieces: ReactNode[] = [];

  switch (t) {
    case "ENTP": // Prospector — seams fanning open from one strike
      pieces.push(st(M(0, 0.82) + L(-0.72, -0.5), 1, 1.1), st(M(0, 0.82) + L(-0.12, -0.85), 1, 1.1), st(M(0, 0.82) + L(0.6, -0.62), 1, 1.1));
      pieces.push(st(M(-0.28, 0.62) + L(-0.5, 0.78), 0.9, 0.8), st(M(0.26, 0.6) + L(0.46, 0.78), 0.9, 0.8));
      pieces.push(hueDot(0, 0.82, 0.11), dia(-0.72, -0.5, 0.16), dia(-0.12, -0.85, 0.16), dia(0.6, -0.62, 0.16));
      break;
    case "INTP": // Cartographer — the compass rose
      pieces.push(inkRing(0, 0, 0.88, 1.1));
      pieces.push(hueFill(M(0, -0.82) + L(0.17, -0.17) + L(0.82, 0) + L(0.17, 0.17) + L(0, 0.82) + L(-0.17, 0.17) + L(-0.82, 0) + L(-0.17, -0.17) + "Z", 0.35));
      pieces.push(st(M(0, -0.82) + L(0.17, -0.17) + L(0.82, 0) + L(0.17, 0.17) + L(0, 0.82) + L(-0.17, 0.17) + L(-0.82, 0) + L(-0.17, -0.17) + "Z"));
      pieces.push(hueFill(M(0, -0.82) + L(0.17, -0.17) + L(-0.17, -0.17) + "Z"), inkDot(0, 0, 0.08));
      break;
    case "ENTJ": // Closer — the pennant planted on the steps
      pieces.push(st(M(-0.85, 0.85) + L(0.85, 0.85), 1, 1.2), st(M(-0.48, 0.6) + L(0.48, 0.6), 1, 1.1));
      pieces.push(st(M(-0.05, 0.6) + L(-0.05, -0.85), 1, 1.3));
      pieces.push(hueFill(M(-0.05, -0.85) + L(0.72, -0.56) + L(-0.05, -0.27) + "Z"));
      pieces.push(st(M(-0.05, -0.85) + L(0.72, -0.56) + L(-0.05, -0.27), 0.9, 0.7));
      break;
    case "INTJ": // Watchman — the dark tower on the horizon, one star out
      pieces.push(st(M(-0.9, 0.75) + L(0.9, 0.75), 1, 1.1));
      pieces.push(inkFill(M(-0.24, 0.75) + L(-0.15, -0.2) + L(-0.26, -0.2) + L(-0.26, -0.36) + L(0.26, -0.36) + L(0.26, -0.2) + L(0.15, -0.2) + L(0.24, 0.75) + "Z"));
      pieces.push(hu(M(0, -0.9) + L(0, -0.52), 1.1), hu(M(-0.19, -0.71) + L(0.19, -0.71), 1.1));
      pieces.push(hueDot(0, -0.71, 0.07));
      break;
    case "ENFP": // Kindler — a young fire, sparks already leaving
      pieces.push(hueFill(M(0, 0.72) + Q(-0.56, 0.26, 0, -0.38) + Q(0.44, 0.22, 0, 0.72) + "Z"));
      pieces.push(st(M(0, 0.72) + Q(-0.56, 0.26, 0, -0.38) + Q(0.44, 0.22, 0, 0.72), 0.9, 0.7));
      pieces.push(st(M(-0.45, 0.82) + L(0.45, 0.82), 1, 1.2));
      pieces.push(hueDot(-0.42, -0.52, 0.08), hueDot(0.14, -0.78, 0.09), hueDot(0.5, -0.4, 0.07));
      break;
    case "INFP": // Poet — one flame, kept in a lamp
      pieces.push(st(M(-0.52, 0.2) + Q(0, 0.95, 0.52, 0.2), 1, 1.2), st(M(-0.66, 0.2) + L(0.66, 0.2), 1, 1.1));
      pieces.push(hueFill(M(0, 0.02) + Q(-0.24, -0.26, 0, -0.56) + Q(0.24, -0.26, 0, 0.02) + "Z"));
      pieces.push(
        <circle key={k++} cx={X(0)} cy={Y(-0.27)} r={0.42 * s} fill="none" stroke={c} strokeWidth={w * 0.6} strokeOpacity={0.4} />,
      );
      break;
    case "ENFJ": // Shepherd — the crook, the flock alongside
      pieces.push(st(M(-0.32, 0.85) + L(-0.32, -0.38), 1, 1.4));
      pieces.push(st(M(-0.32, -0.38) + Q(-0.32, -0.86, 0.06, -0.86) + Q(0.4, -0.86, 0.4, -0.52), 1, 1.4));
      pieces.push(hueDot(0.38, 0.12, 0.1), hueDot(0.66, 0.42, 0.1), hueDot(0.3, 0.62, 0.1));
      break;
    case "INFJ": // Seer — the eye, lit from above
      pieces.push(hueFill(M(-0.78, 0.12) + Q(0, -0.46, 0.78, 0.12) + Q(0, 0.66, -0.78, 0.12) + "Z", 0.25));
      pieces.push(st(M(-0.78, 0.12) + Q(0, -0.46, 0.78, 0.12) + Q(0, 0.66, -0.78, 0.12) + "Z", 1, 1.1));
      pieces.push(hueDot(0, 0.12, 0.17), inkDot(0, 0.12, 0.07));
      pieces.push(st(M(0, -0.56) + L(0, -0.88)), st(M(-0.42, -0.44) + L(-0.6, -0.7)), st(M(0.42, -0.44) + L(0.6, -0.7)));
      break;
    case "ESTP": // Daredevil — the bolt
      pieces.push(hueFill(M(0.32, -0.88) + L(-0.38, 0.1) + L(-0.03, 0.1) + L(-0.32, 0.88) + L(0.45, -0.13) + L(0.09, -0.13) + "Z"));
      pieces.push(st(M(0.32, -0.88) + L(-0.38, 0.1) + L(-0.03, 0.1) + L(-0.32, 0.88) + L(0.45, -0.13) + L(0.09, -0.13) + "Z", 0.9, 0.8));
      break;
    case "ISTP": // Marksman — the crosshair
      pieces.push(inkRing(0, 0, 0.62, 1.2));
      pieces.push(
        <circle key={k++} cx={X(0)} cy={Y(0)} r={0.34 * s} fill="none" stroke="var(--ink)" strokeWidth={w * 0.6} strokeOpacity={0.5} />,
      );
      pieces.push(st(M(0, -0.95) + L(0, -0.42), 1, 1.2), st(M(0, 0.42) + L(0, 0.95), 1, 1.2));
      pieces.push(st(M(-0.95, 0) + L(-0.42, 0), 1, 1.2), st(M(0.42, 0) + L(0.95, 0), 1, 1.2));
      pieces.push(hueDot(0, 0, 0.12));
      break;
    case "ESTJ": // Foreman — the plumb line off the beam
      pieces.push(st(M(-0.55, 0.85) + L(-0.55, -0.6), 1, 1.4), st(M(-0.88, -0.6) + L(0.78, -0.6), 1, 1.4));
      pieces.push(st(M(0.36, -0.6) + L(0.36, 0.26), 0.9));
      pieces.push(hueFill(M(0.22, 0.26) + L(0.5, 0.26) + L(0.36, 0.68) + "Z"));
      break;
    case "ISTJ": // Keeper — the key
      pieces.push(hueFill(M(0, -0.76) + L(0.26, -0.5) + L(0, -0.24) + L(-0.26, -0.5) + "Z", 0.35));
      pieces.push(inkRing(0, -0.5, 0.28, 1.3), st(M(0, -0.22) + L(0, 0.82), 1, 1.4));
      pieces.push(st(M(0, 0.82) + L(0.34, 0.82), 1, 1.3), st(M(0, 0.56) + L(0.24, 0.56), 1, 1.3));
      pieces.push(hueDot(0, -0.5, 0.09));
      break;
    case "ESFP": // Showman — the firework
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4 + Math.PI / 8;
        const len = i % 2 ? 0.6 : 0.9;
        const [x1, y1] = [Math.cos(a) * 0.2, Math.sin(a) * 0.2];
        const [x2, y2] = [Math.cos(a) * len, Math.sin(a) * len];
        pieces.push(i % 2 ? st(M(x1, y1) + L(x2, y2), 1, 1.1) : hu(M(x1, y1) + L(x2, y2), 1.1));
        if (i % 2 === 0) pieces.push(hueDot(x2, y2, 0.08));
      }
      pieces.push(hueDot(0, 0, 0.12));
      break;
    case "ISFP": // Maker — the leaf
      pieces.push(hueFill(M(0, -0.85) + Q(0.66, -0.2, 0, 0.85) + Q(-0.66, -0.2, 0, -0.85) + "Z", 0.3));
      pieces.push(st(M(0, -0.85) + Q(0.66, -0.2, 0, 0.85) + Q(-0.66, -0.2, 0, -0.85) + "Z", 1, 1.1));
      pieces.push(st(M(0, -0.6) + L(0, 0.62), 0.9));
      pieces.push(st(M(0, -0.12) + L(0.3, -0.34), 0.8, 0.8), st(M(0, 0.26) + L(-0.3, 0.04), 0.8, 0.8));
      break;
    case "ESFJ": // Host — the bowl, still warm
      pieces.push(hueFill(M(-0.64, 0.08) + Q(0, 0.95, 0.64, 0.08) + "Z", 0.35));
      pieces.push(st(M(-0.64, 0.08) + Q(0, 0.95, 0.64, 0.08), 1, 1.2), st(M(-0.76, 0.08) + L(0.76, 0.08), 1, 1.2));
      pieces.push(hu(M(-0.22, -0.14) + Q(-0.38, -0.42, -0.22, -0.7), 1.1), hu(M(0.22, -0.1) + Q(0.06, -0.38, 0.22, -0.66), 1.1));
      break;
    case "ISFJ": // Custodian — the house, kept
      pieces.push(st(M(-0.82, -0.02) + L(0, -0.74) + L(0.82, -0.02), 1, 1.4));
      pieces.push(st(M(-0.58, -0.06) + L(-0.58, 0.84) + L(0.58, 0.84) + L(0.58, -0.06), 1, 1.1));
      pieces.push(st(M(-0.14, 0.84) + L(-0.14, 0.38) + L(0.14, 0.38) + L(0.14, 0.84), 0.9));
      pieces.push(hueFill(M(0.22, 0.2) + L(0.44, 0.2) + L(0.44, 0.44) + L(0.22, 0.44) + "Z"));
      break;
  }
  return <g>{pieces}</g>;
}
