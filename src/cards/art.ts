import { alpha, beta, omega } from "../engine/core";
import type { Fn } from "../engine/data";
import { CANVAS, FN_COLOR, easeColor } from "../engine/palette";
import type { ArtSpec } from "./deck";

/* ------------------------------------------------------------------ *
 * GENERATIVE CARD ART
 *
 * One picture per card, drawn rather than illustrated. Two rules hold
 * across all seven generators:
 *
 *   1. Deterministic. Every random number comes from a PRNG seeded by
 *      the card's id, so the same deck renders byte-identical twice and
 *      a diff in the art means a diff in the data. Asserted in
 *      tests/cards.test.ts.
 *   2. Derived. Colour is never decorative — a hue is always the hue of
 *      a real function from the app's palette, and the composition is
 *      driven by the card's own structure: how deep a slot sits, how
 *      coherent a relation scores, which four elements a camp shares.
 *
 * Output is SVG (vector all the way into the PDF, so it prints at the
 * press's resolution rather than at ours) in a 300 x 174 viewBox, drawn
 * to bleed off all four edges of the art panel.
 * ------------------------------------------------------------------ */

/**
 * The art covers the whole card, not a panel: 300 x 409 is the bleed page's own
 * ratio. Each generator composes inside the BAND at the top, which is the part
 * that shows at full strength; whatever trails below it runs on behind the text
 * under a 96%-opaque paper wash, which reads as tone rather than as picture.
 */
export const ART_W = 300;
export const ART_H = 409;
/** The visible band, in the same units. */
export const BAND = 104;
const CY = 44;

const INK = "#241F19";
const PAPER = CANVAS.light;
const hue = (f: Fn) => FN_COLOR.light[f];

/* ----------------------------- randomness ----------------------------- */

/** A tiny string hash, so a card id becomes a 32-bit seed. */
function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — small, fast, and good enough that no two cards look related. */
function prng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface R {
  (): number;
  /** Uniform in [lo, hi). */
  between(lo: number, hi: number): number;
  /** Symmetric jitter around zero. */
  jitter(mag: number): number;
  pick<T>(xs: T[]): T;
}

function rng(seed: string): R {
  const r = prng(hashSeed(seed)) as R;
  r.between = (lo, hi) => lo + r() * (hi - lo);
  r.jitter = (m) => (r() - 0.5) * 2 * m;
  r.pick = (xs) => xs[Math.floor(r() * xs.length) % xs.length];
  return r;
}

/* ------------------------------ drawing ------------------------------ */

const n = (v: number) => Math.round(v * 100) / 100;
const pt = (x: number, y: number) => `${n(x)},${n(y)}`;
const polar = (cx: number, cy: number, r: number, a: number): [number, number] => [cx + r * Math.cos(a), cy + r * Math.sin(a)];

/** A smooth open curve through the given points, as a quadratic path. */
function curve(points: [number, number][]): string {
  if (points.length < 2) return "";
  let d = `M${pt(...points[0])}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const [nx, ny] = points[i + 1];
    d += `Q${pt(x, y)} ${pt((x + nx) / 2, (y + ny) / 2)}`;
  }
  d += `L${pt(...points[points.length - 1])}`;
  return d;
}

const line = (d: string, stroke: string, w: number, o = 1) =>
  `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${n(w)}" stroke-opacity="${n(o)}" stroke-linecap="round"/>`;
const dot = (x: number, y: number, r: number, fill: string, o = 1) =>
  `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${fill}" fill-opacity="${n(o)}"/>`;
const ring = (x: number, y: number, r: number, stroke: string, w: number, o = 1) =>
  `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="none" stroke="${stroke}" stroke-width="${n(w)}" stroke-opacity="${n(o)}"/>`;

/** The paper the art sits on, plus a faint tone so the panel reads as a panel. */
function ground(tint: string, r: R): string {
  const grain: string[] = [];
  for (let i = 0; i < 260; i++) {
    grain.push(dot(r.between(0, ART_W), r.between(0, ART_H), r.between(0.2, 0.8), INK, r.between(0.02, 0.07)));
  }
  return (
    `<rect width="${ART_W}" height="${ART_H}" fill="${PAPER}"/>` +
    `<rect width="${ART_W}" height="${BAND * 1.4}" fill="${tint}" fill-opacity="0.08"/>` +
    grain.join("")
  );
}

/* ---------------------------- the gestures ---------------------------- */

/**
 * Each element has one movement, and every generator that draws a function
 * draws this. Ne branches outward, Ni converges on a point, Se strikes, Si
 * stratifies, Te squares off, Ti subdivides, Fe links, Fi points inward.
 */
function gesture(fn: Fn, cx: number, cy: number, scale: number, r: R, weight = 1): string {
  const c = hue(fn);
  const out: string[] = [];
  const s = scale;

  switch (fn) {
    case "Ne": {
      const branch = (x: number, y: number, a: number, len: number, depth: number) => {
        if (depth === 0 || len < s * 0.08) return;
        const [ex, ey] = polar(x, y, len, a);
        out.push(line(`M${pt(x, y)}L${pt(ex, ey)}`, c, 0.5 * weight * depth * 0.5, 0.8));
        out.push(dot(ex, ey, 0.7 * weight, c, 0.6));
        const spread = r.between(0.35, 0.75);
        branch(ex, ey, a - spread, len * r.between(0.5, 0.75), depth - 1);
        branch(ex, ey, a + spread, len * r.between(0.5, 0.75), depth - 1);
        if (r() > 0.6) branch(ex, ey, a + r.jitter(0.2), len * 0.6, depth - 1);
      };
      for (let i = 0; i < 3; i++) branch(cx, cy + s * 0.5, -Math.PI / 2 + r.jitter(0.9), s * 0.34, 4);
      break;
    }
    case "Ni": {
      for (let i = 0; i < 26; i++) {
        const a = r.between(0, Math.PI * 2);
        const [sx, sy] = polar(cx, cy, s * r.between(0.75, 1.25), a);
        const mid = polar(cx, cy, s * 0.45, a + r.jitter(0.5));
        out.push(line(curve([[sx, sy], mid, [cx, cy]]), c, 0.45 * weight, r.between(0.3, 0.85)));
      }
      out.push(dot(cx, cy, 2.4 * weight, c, 1));
      out.push(ring(cx, cy, 5.5 * weight, c, 0.5, 0.5));
      break;
    }
    case "Se": {
      for (let i = 0; i < 16; i++) {
        const a = r.between(0, Math.PI * 2);
        const d = s * r.between(0.15, 1.1);
        const [x, y] = polar(cx, cy, d, a);
        const len = s * r.between(0.08, 0.3);
        const [ex, ey] = polar(x, y, len, a + Math.PI / 2 + r.jitter(0.4));
        out.push(line(`M${pt(x, y)}L${pt(ex, ey)}`, c, r.between(0.6, 1.6) * weight, r.between(0.45, 1)));
      }
      out.push(dot(cx, cy, 1.8 * weight, c, 0.9));
      break;
    }
    case "Si": {
      for (let i = 0; i < 11; i++) {
        const y = cy - s * 0.9 + (i * s * 1.8) / 10;
        const pts: [number, number][] = [];
        for (let k = 0; k <= 8; k++) {
          pts.push([cx - s + (k * s * 2) / 8, y + r.jitter(1.2 + i * 0.15)]);
        }
        out.push(line(curve(pts), c, (i % 3 === 0 ? 0.9 : 0.4) * weight, r.between(0.35, 0.8)));
      }
      break;
    }
    case "Te": {
      const cols = 5, rows = 4;
      for (let i = 0; i < cols; i++) {
        for (let k = 0; k < rows; k++) {
          if (r() > 0.72) continue;
          const x = cx - s * 0.9 + (i * s * 1.8) / (cols - 1);
          const y = cy - s * 0.7 + (k * s * 1.4) / (rows - 1);
          const w = s * r.between(0.12, 0.3);
          out.push(
            `<rect x="${n(x - w / 2)}" y="${n(y - w / 4)}" width="${n(w)}" height="${n(w / 2)}" fill="none" stroke="${c}" stroke-width="${n(0.55 * weight)}" stroke-opacity="${n(r.between(0.4, 0.95))}"/>`,
          );
          if (r() > 0.55) out.push(line(`M${pt(x + w / 2, y)}L${pt(x + w, y)}`, c, 0.4 * weight, 0.5));
        }
      }
      break;
    }
    case "Ti": {
      const split = (x: number, y: number, w: number, h: number, depth: number) => {
        out.push(
          `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="none" stroke="${c}" stroke-width="${n(0.4 * weight)}" stroke-opacity="${n(0.35 + depth * 0.12)}"/>`,
        );
        if (depth === 0 || w < s * 0.12) return;
        if (w > h) {
          const k = w * r.between(0.35, 0.65);
          split(x, y, k, h, depth - 1);
          split(x + k, y, w - k, h, depth - 1);
        } else {
          const k = h * r.between(0.35, 0.65);
          split(x, y, w, k, depth - 1);
          split(x, y + k, w, h - k, depth - 1);
        }
      };
      split(cx - s, cy - s * 0.72, s * 2, s * 1.44, 4);
      break;
    }
    case "Fe": {
      const nodes: [number, number][] = [];
      for (let i = 0; i < 7; i++) {
        nodes.push(polar(cx, cy, s * r.between(0.45, 1.05), (i / 7) * Math.PI * 2 + r.jitter(0.3)));
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let k = i + 1; k < nodes.length; k++) {
          if (r() > 0.5) continue;
          const [ax, ay] = nodes[i], [bx, by] = nodes[k];
          const mx = (ax + bx) / 2 + r.jitter(s * 0.3), my = (ay + by) / 2 + r.jitter(s * 0.3);
          out.push(line(curve([[ax, ay], [mx, my], [bx, by]]), c, 0.45 * weight, r.between(0.3, 0.7)));
        }
      }
      for (const [x, y] of nodes) out.push(dot(x, y, r.between(1, 2) * weight, c, 0.9));
      break;
    }
    case "Fi": {
      for (let i = 0; i < 5; i++) out.push(ring(cx, cy, s * (0.28 + i * 0.19), c, 0.4 * weight, 0.55 - i * 0.07));
      const a = r.between(0, Math.PI * 2);
      const [tx, ty] = polar(cx, cy, s * 0.95, a);
      const [bx, by] = polar(cx, cy, s * 0.5, a + Math.PI);
      out.push(line(`M${pt(bx, by)}L${pt(tx, ty)}`, c, 1.5 * weight, 1));
      out.push(dot(tx, ty, 2 * weight, c, 1));
      out.push(dot(cx, cy, 1.1 * weight, INK, 0.7));
      break;
    }
  }
  return out.join("");
}

/* ---------------------------- generators ---------------------------- */

/** Faint continuation below the band, so the lower half of the card is toned rather than blank. */
function descent(fns: Fn[], r: R, density = 26): string {
  const out: string[] = [];
  for (let i = 0; i < density; i++) {
    const f = fns[i % fns.length];
    const y = r.between(BAND * 0.7, ART_H);
    const pts: [number, number][] = [];
    let x = r.between(-20, ART_W + 20);
    let yy = y;
    for (let k = 0; k < 5; k++) {
      pts.push([x, yy]);
      x += r.jitter(30);
      yy += r.between(10, 34);
    }
    out.push(line(curve(pts), hue(f), r.between(0.3, 0.8), r.between(0.25, 0.5)));
  }
  return out.join("");
}

/** Types: a flow field aimed by the Lead, with the eight slots as a crescent of nodes. */
function circuit(fns: Fn[], r: R): string {
  const lead = fns[0];
  const out: string[] = [ground(hue(lead), r)];

  // The field's direction is the Lead's family: N rises, S runs level, T squares, F curls.
  const fam = lead[0];
  const base = fam === "N" ? -Math.PI / 2.4 : fam === "S" ? 0 : fam === "T" ? -Math.PI / 6 : Math.PI / 5;
  const swirl = fam === "F" ? 0.9 : fam === "N" ? 0.55 : fam === "T" ? 0.12 : 0.3;
  const inward = lead[1] === "i";

  for (let i = 0; i < 90; i++) {
    const f = fns[i % 8];
    const front = i % 8 < 4;
    let x = r.between(-20, ART_W + 20);
    let y = r.between(-10, ART_H);
    let a = base + r.jitter(0.5);
    const pts: [number, number][] = [[x, y]];
    const steps = Math.floor(r.between(6, 16));
    for (let k = 0; k < steps; k++) {
      a += Math.sin((x + y) / (inward ? 38 : 74)) * swirl * 0.5 + r.jitter(0.16);
      const step = r.between(6, 15);
      x += Math.cos(a) * step;
      y += Math.sin(a) * step;
      pts.push([x, y]);
    }
    const near = y < BAND * 1.2;
    out.push(line(curve(pts), hue(f), front ? r.between(0.5, 1.3) : r.between(0.3, 0.7), (near ? 1 : 0.75) * (front ? r.between(0.35, 0.7) : r.between(0.12, 0.28))));
  }

  // The stack itself: eight nodes on a shallow crescent, solid in front, hollow
  // behind. Inset far enough that the end nodes clear the trim line by 6mm even
  // if the guillotine wanders — the art bleeds, the data on it must not.
  const INSET = 42;
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const x = INSET + t * (ART_W - INSET * 2);
    const y = CY + 17 - Math.sin(t * Math.PI) * 26;
    const size = 9 - i * 0.78;
    if (i > 0) {
      const pt0 = INSET + ((i - 1) / 7) * (ART_W - INSET * 2);
      const py = CY + 17 - Math.sin(((i - 1) / 7) * Math.PI) * 26;
      out.push(line(`M${pt(pt0, py)}L${pt(x, y)}`, INK, 0.45, i < 4 ? 0.4 : 0.18));
    }
    if (i < 4) {
      out.push(dot(x, y, size, PAPER, 1));
      out.push(dot(x, y, size, hue(fns[i]), 0.92));
      out.push(ring(x, y, size + 2, hue(fns[i]), 0.55, 0.5));
    } else {
      out.push(dot(x, y, size, PAPER, 0.9));
      out.push(ring(x, y, size, hue(fns[i]), 0.8, 0.6));
    }
  }
  out.push(gesture(lead, ART_W / 2, CY - 4, 26, r, 0.9));
  return out.join("");
}

/** Functions: one element, at full size, doing its own movement across the band. */
function element(fn: Fn, r: R): string {
  const out: string[] = [ground(hue(fn), r)];
  out.push(gesture(fn, ART_W / 2 + r.jitter(14), CY, 40, r, 1.6));
  out.push(gesture(fn, 44 + r.jitter(10), CY + r.jitter(12), 26, r, 0.9));
  out.push(gesture(fn, ART_W - 44 + r.jitter(10), CY + r.jitter(12), 24, r, 0.85));
  out.push(ring(ART_W / 2, CY, 40, hue(fn), 0.45, 0.3));
  out.push(gesture(fn, ART_W / 2, BAND * 2.2, 60, r, 0.5));
  out.push(descent([fn], r, 14));
  return out.join("");
}

/** Attitudes: eight bars, this one full height and inked, the rest short and quiet. */
function seat(depth: number, r: R): string {
  const tone = depth < 4 ? "#6A4416" : "#4B2A8F";
  const out: string[] = [ground(tone, r)];
  const all: Fn[] = ["Ne", "Ni", "Se", "Si", "Te", "Ti", "Fe", "Fi"];
  const gapW = (ART_W - 52) / 8;
  const bw = gapW * 0.52;
  const floor = CY + 40;

  for (let i = 0; i < 8; i++) {
    const x = 26 + gapW * (i + 0.5);
    const here = i === depth;
    // Bar height is how conscious the seat is; the fill is whether it is this card's.
    const h = here ? 74 : 56 - i * 5.2;
    const top = floor - h;
    out.push(
      `<rect x="${n(x - bw / 2)}" y="${n(top)}" width="${n(bw)}" height="${n(h)}" fill="${here ? INK : PAPER}" fill-opacity="${here ? 0.88 : 0.75}" stroke="${INK}" stroke-width="${here ? 0.9 : 0.5}" stroke-opacity="${here ? 0.9 : 0.35}"/>`,
    );
    // The element that could sit in this seat, sketched inside the bar.
    out.push(gesture(all[(i * 3 + depth) % 8], x, top + h * 0.5, bw * 0.75, r, here ? 0.9 : 0.5));
    if (here) {
      out.push(dot(x, top, 5, PAPER, 1));
      out.push(ring(x, top, 5, INK, 1.2, 1));
      out.push(ring(x, top, 12, INK, 0.4, 0.4));
    }
    out.push(`<text x="${n(x)}" y="${n(floor + 9)}" font-size="7" fill="${INK}" fill-opacity="${here ? 0.75 : 0.28}" text-anchor="middle" font-family="DejaVu Sans, sans-serif">${i + 1}</text>`);
  }
  out.push(line(`M${pt(18, floor)}L${pt(ART_W - 18, floor)}`, INK, 0.6, 0.45));
  out.push(descent(all, r, 14));
  return out.join("");
}

/** Camps: the four shared elements as petals, interfering where they overlap. */
function rosette(fns: Fn[], r: R): string {
  const out: string[] = [ground(hue(fns[0]), r)];
  for (let i = 0; i < fns.length; i++) {
    const a = (i / fns.length) * Math.PI * 2 - Math.PI / 2;
    const [px, py] = polar(ART_W / 2, CY, 23, a);
    out.push(gesture(fns[i], px, py, 24, r, 1));
    out.push(ring(px, py, 24, hue(fns[i]), 0.5, 0.45));
  }
  for (let i = 0; i < 5; i++) out.push(ring(ART_W / 2, CY, 14 + i * 12, INK, 0.32, 0.16 - i * 0.02));
  out.push(dot(ART_W / 2, CY, 2.2, INK, 0.55));
  out.push(descent(fns, r, 20));
  return out.join("");
}

/** Sides: a door, open by exactly as much as that side is reachable. */
function door(openness: number, fns: Fn[], r: R): string {
  const out: string[] = [ground(hue(fns[0]), r)];
  const cx = ART_W / 2;
  const dw = 54, dh = 74;
  const x0 = cx - dw / 2, y0 = CY - dh / 2 + 4;

  for (let i = 0; i < 4; i++) {
    out.push(gesture(fns[i], cx + (i - 1.5) * 16, CY + 4 + r.jitter(7), 16, r, 0.7 + openness));
  }
  out.push(`<rect x="${n(x0 - 8)}" y="${n(y0 - 8)}" width="${n(dw + 16)}" height="${n(dh + 8)}" fill="none" stroke="${INK}" stroke-width="1.7" stroke-opacity="0.75"/>`);
  const leafW = dw * (1 - openness);
  if (leafW > 0.5) {
    out.push(`<rect x="${n(x0)}" y="${n(y0)}" width="${n(leafW)}" height="${n(dh)}" fill="${PAPER}" fill-opacity="0.96" stroke="${INK}" stroke-width="1.1" stroke-opacity="0.8"/>`);
    for (let i = 0; i < 4; i++) {
      const yy = y0 + 8 + (i * (dh - 16)) / 3;
      out.push(line(`M${pt(x0 + 3.5, yy)}L${pt(x0 + leafW - 3.5, yy)}`, INK, 0.4, 0.3));
    }
    if (leafW > 10) out.push(dot(x0 + leafW - 6, CY + 4, 1.7, INK, 0.7));
  }
  if (openness === 0) {
    for (let i = 0; i < 3; i++) {
      const yy = y0 + 16 + i * 23;
      out.push(line(`M${pt(x0 - 13, yy + r.jitter(2))}L${pt(x0 + dw + 13, yy + r.jitter(2))}`, INK, 2.6, 0.85));
    }
  }
  // Light on the floor, proportional to the gap — it falls down the card.
  if (openness > 0) {
    const spill = 40 + openness * 90;
    out.push(
      `<path d="M${pt(x0 + leafW, y0 + dh)}L${pt(x0 + dw, y0 + dh)}L${pt(cx + spill, ART_H)}L${pt(cx - spill * 0.5, ART_H)}Z" fill="${hue(fns[0])}" fill-opacity="${n(0.07 + openness * 0.1)}"/>`,
    );
  }
  return out.join("");
}

/** Channels: two wirings meeting. Ease decides whether the bundle runs clean or crosses. */
function channel(score: number, fns: Fn[], r: R): string {
  const k = score / 100;
  const tone = easeColor(score, "light");
  const out: string[] = [ground(tone, r)];
  const ax = 42, bx = ART_W - 42;

  for (let i = 0; i < 34; i++) {
    const f = fns[i % fns.length];
    const spread = (1 - k) * 34;
    const y0 = CY + r.jitter(24);
    const y1 = CY + r.jitter(24);
    const m1: [number, number] = [ax + (bx - ax) * 0.33, y0 + r.jitter(5 + spread)];
    const m2: [number, number] = [ax + (bx - ax) * 0.67, y1 + r.jitter(5 + spread)];
    out.push(line(curve([[ax, y0], m1, m2, [bx, y1]]), hue(f), r.between(0.35, 1), r.between(0.2, 0.25 + k * 0.5)));
  }
  if (k < 0.5) {
    for (let i = 0; i < Math.round((0.5 - k) * 34); i++) {
      const x = ART_W / 2 + r.jitter(30);
      const y = CY + r.jitter(20);
      out.push(line(`M${pt(x - 4, y - 4)}L${pt(x + 4, y + 4)}`, tone, 0.9, 0.55));
      out.push(line(`M${pt(x + 4, y - 4)}L${pt(x - 4, y + 4)}`, tone, 0.9, 0.55));
    }
  }
  for (const [x, pair] of [[ax, fns.slice(0, 2)], [bx, fns.slice(2)]] as [number, Fn[]][]) {
    out.push(dot(x, CY, 16, PAPER, 0.96));
    out.push(ring(x, CY, 16, INK, 0.65, 0.6));
    out.push(gesture(pair[0], x, CY, 12, r, 0.7));
  }
  // The score, as a bar of exactly that length.
  const bw = (bx - ax) * k;
  out.push(line(`M${pt(ax, CY + 36)}L${pt(bx, CY + 36)}`, INK, 0.5, 0.22));
  out.push(line(`M${pt(ax, CY + 36)}L${pt(ax + bw, CY + 36)}`, tone, 2.6, 0.9));
  out.push(descent(fns, r, 16));
  return out.join("");
}

/** Wheels: an octagram, one end marked open and the other closed. */
function star(fns: Fn[], r: R): string {
  const out: string[] = [ground(hue(fns[0]), r)];
  const cx = ART_W / 2, R0 = 38;

  for (const rot of [0, Math.PI / 4]) {
    const pts = [0, 1, 2, 3].map((i) => polar(cx, CY, R0, rot + (i / 4) * Math.PI * 2 - Math.PI / 2));
    out.push(`<path d="M${pts.map((p) => pt(...p)).join("L")}Z" fill="none" stroke="${INK}" stroke-width="0.9" stroke-opacity="0.55"/>`);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const f = fns[i % fns.length];
    const [ex, ey] = polar(cx, CY, R0 * r.between(0.92, 1.14), a);
    out.push(line(`M${pt(cx, CY)}L${pt(ex, ey)}`, hue(f), 0.55, 0.45));
    out.push(dot(ex, ey, r.between(1.6, 3), hue(f), 0.85));
    for (let k = 0; k < 6; k++) {
      const [x, y] = polar(cx, CY, R0 * r.between(0.25, 1.05), a + r.jitter(0.22));
      out.push(dot(x, y, r.between(0.5, 1.4), hue(f), r.between(0.2, 0.55)));
    }
  }
  out.push(ring(cx, CY, R0, INK, 0.5, 0.35));
  out.push(ring(cx, CY, R0 * 0.5, INK, 0.35, 0.25));
  // The two ends are not the same kind of thing: virtue open, sin filled.
  out.push(dot(cx, CY - R0, 4.6, PAPER, 1));
  out.push(ring(cx, CY - R0, 4.6, INK, 1.2, 0.9));
  out.push(dot(cx, CY + R0, 4.6, INK, 0.85));
  out.push(gesture(fns[0], cx, CY, 15, r, 0.75));
  out.push(descent(fns, r, 18));
  return out.join("");
}

/** Front matter: the eight elements in a ring, wired by the three involutions. */
function mark(fns: Fn[], r: R): string {
  const out: string[] = [ground(INK, r)];
  const cx = ART_W / 2, R0 = 38;
  const at = (f: Fn): [number, number] => polar(cx, CY, R0, (fns.indexOf(f) / 8) * Math.PI * 2 - Math.PI / 2);

  const chords: [Record<Fn, Fn>, number, number][] = [[alpha, 0.5, 0.5], [beta, 0.34, 0.4], [omega, 0.22, 0.9]];
  for (const [op, opacity, bow] of chords) {
    for (const f of fns) {
      const [ax, ay] = at(f);
      const [bx, by] = at(op[f]);
      const mx = cx + ((ax + bx) / 2 - cx) * bow;
      const my = CY + ((ay + by) / 2 - CY) * bow;
      out.push(line(curve([[ax, ay], [mx, my], [bx, by]]), hue(f), 0.5, opacity));
    }
  }
  for (const f of fns) {
    const [x, y] = at(f);
    out.push(dot(x, y, 6.5, PAPER, 1));
    out.push(dot(x, y, 6.5, hue(f), 0.92));
    out.push(ring(x, y, 8.5, hue(f), 0.45, 0.5));
  }
  out.push(ring(cx, CY, R0, INK, 0.4, 0.2));
  out.push(descent(fns, r, 22));
  return out.join("");
}

/* ------------------------------- entry ------------------------------- */

/** The art for one card, as a complete `<svg>` element. Deterministic in `id`. */
export function artFor(id: string, spec: ArtSpec): string {
  const r = rng(id);
  let body: string;
  switch (spec.kind) {
    case "circuit": body = circuit(spec.fns, r); break;
    case "element": body = element(spec.fn, r); break;
    case "seat": body = seat(spec.depth, r); break;
    case "rosette": body = rosette(spec.fns, r); break;
    case "door": body = door(spec.openness, spec.fns, r); break;
    case "channel": body = channel(spec.score, spec.fns, r); break;
    case "star": body = star(spec.fns, r); break;
    case "mark": body = mark(spec.fns, r); break;
  }
  return `<svg class="art" viewBox="0 0 ${ART_W} ${ART_H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
}
