import { omega } from "../engine/core";
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
/**
 * The window art may put readable marks in, in art units.
 *
 * TOP is 6mm from the page edge — the same clearance the text keeps, because a
 * guillotine that wanders does not care whether it is cutting a word or a
 * label. BOTTOM is where render.ts starts washing the art back to paper
 * (17mm); anything below this is tone, not information. Every generator that
 * prints text keeps inside [SAFE_TOP, SAFE_BOTTOM].
 */
const SAFE_TOP = 26;
const SAFE_BOTTOM = 72;

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

/**
 * Text in the art layer. One art unit is 0.2303mm on the printed page
 * (300 units across a 69.09mm bleed page), so `size` is in units and the
 * printed point size is size x 0.653. LABEL_MIN is the smallest size any
 * caller may use: 7 units = 4.57pt, the deck's chrome floor.
 */
export const LABEL_MIN = 7;
const label = (
  x: number, y: number, text: string, size: number, fill: string,
  { weight = 700, o = 1, spread = 0.02 }: { weight?: number; o?: number; spread?: number } = {},
) =>
  `<text x="${n(x)}" y="${n(y)}" font-size="${n(size)}" font-weight="${weight}" fill="${fill}" ` +
  `fill-opacity="${n(o)}" text-anchor="middle" dominant-baseline="central" ` +
  `letter-spacing="${n(size * spread)}" font-family="Inter, DejaVu Sans, Liberation Sans, sans-serif">${text}</text>`;

/**
 * THE ONE MARK THIS DECK IS BUILT ON: an element, named.
 *
 * Colour alone cannot say which element a circle is — four hue families over
 * eight elements means every hue appears twice, and a reader opening the box
 * has been given no key yet. So every function mark in every generator prints
 * its two letters. Filled means the element is conscious here, hollow means it
 * runs in shadow; the letters are legible either way.
 */
function fnMark(
  fn: Fn, x: number, y: number, r: number,
  { solid = true, caption, captionSize = 8 }: { solid?: boolean; caption?: string; captionSize?: number } = {},
): string {
  const c = hue(fn);
  const out = [dot(x, y, r, PAPER, 1)];
  if (solid) {
    out.push(dot(x, y, r, c, 1));
    out.push(label(x, y, fn, r * 1.02, PAPER));
  } else {
    out.push(ring(x, y, r, c, r * 0.16, 0.95));
    out.push(label(x, y, fn, r * 1.02, c, { weight: 600 }));
  }
  if (caption) out.push(label(x, y + r + captionSize * 0.95, caption, captionSize, INK, { weight: 600, o: 0.72 }));
  return out.join("");
}

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

/**
 * Types: the eight-slot stack, read left to right, over a flow field aimed by
 * the Lead.
 *
 * The stack is the whole point of a Wiring card, so it is drawn as eight named
 * marks in slot order rather than as a decorative crescent — filled for the
 * four conscious slots, hollow for the four in shadow, numbered to match the
 * slot strip printed directly beneath it. The field behind is held well back:
 * it carries the Lead's character, and nothing else may compete with the row.
 */
function circuit(fns: Fn[], r: R): string {
  const lead = fns[0];
  const out: string[] = [ground(hue(lead), r)];

  // The field's direction is the Lead's family: N rises, S runs level, T squares, F curls.
  const fam = lead[0];
  const base = fam === "N" ? -Math.PI / 2.4 : fam === "S" ? 0 : fam === "T" ? -Math.PI / 6 : Math.PI / 5;
  const swirl = fam === "F" ? 0.9 : fam === "N" ? 0.55 : fam === "T" ? 0.12 : 0.3;
  const inward = lead[1] === "i";

  for (let i = 0; i < 74; i++) {
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
    out.push(line(curve(pts), hue(f), front ? r.between(0.4, 0.9) : r.between(0.3, 0.6), front ? r.between(0.16, 0.3) : r.between(0.08, 0.16)));
  }

  // The row. Inset so the end marks clear the trim by 6mm even if the
  // guillotine wanders — the art bleeds, the data printed on it must not.
  const R0 = 12;
  const x0 = 26 + R0;
  const gap = (ART_W - x0 * 2) / 7;
  const y = 47;
  out.push(line(`M${pt(x0, y)}L${pt(x0 + gap * 7, y)}`, INK, 0.5, 0.25));
  for (let i = 0; i < 8; i++) {
    out.push(fnMark(fns[i], x0 + gap * i, y, R0, { solid: i < 4, caption: String(i + 1), captionSize: 8 }));
  }
  // Where the conscious four end and the shadow four begin.
  const split = x0 + gap * 3.5;
  out.push(line(`M${pt(split, SAFE_TOP + 3)}L${pt(split, y + R0 + 11)}`, INK, 0.5, 0.35));
  out.push(label(x0 + gap * 1.5, SAFE_TOP + 4, "CONSCIOUS", 7.5, INK, { weight: 700, o: 0.6, spread: 0.14 }));
  out.push(label(x0 + gap * 5.5, SAFE_TOP + 4, "SHADOW", 7.5, INK, { weight: 700, o: 0.45, spread: 0.14 }));
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

/**
 * Seats: eight positions, this one filled, bar height falling with awareness.
 *
 * DELIBERATELY ELEMENT-FREE. The first version sketched a function's gesture
 * inside each bar, picked by `(i * 3 + depth) % 8` — which drew a different
 * element in slot 3 on every card and so asserted a slot-to-element mapping
 * that does not exist. A seat is type-agnostic: which element sits in it is
 * exactly the thing that varies across the sixteen Wirings. So the bars carry
 * their number and their awareness and nothing more.
 */
function seat(depth: number, r: R): string {
  // Tinted with ink, not with a function hue. The first build used Si's amber
  // for the conscious seats and Ni's violet for the shadow ones, which reads as
  // an element claim on a card whose whole point is that no element is implied.
  const out: string[] = [ground(INK, r)];
  const gapW = (ART_W - 52) / 8;
  const bw = gapW * 0.54;
  const floor = SAFE_BOTTOM - 14;

  for (let i = 0; i < 8; i++) {
    const x = 26 + gapW * (i + 0.5);
    const here = i === depth;
    // Height is how much awareness the seat carries: slot 1 the most, slot 8 the least.
    const h = 30 - i * 3;
    const top = floor - h;
    out.push(
      `<rect x="${n(x - bw / 2)}" y="${n(top)}" width="${n(bw)}" height="${n(h)}" fill="${here ? INK : PAPER}" fill-opacity="${here ? 0.85 : 0.7}" stroke="${INK}" stroke-width="${here ? 0.9 : 0.5}" stroke-opacity="${here ? 0.9 : 0.3}"/>`,
    );
    out.push(label(x, floor + 7, String(i + 1), 8, INK, { weight: here ? 700 : 600, o: here ? 0.85 : 0.3 }));
  }
  out.push(line(`M${pt(18, floor)}L${pt(ART_W - 18, floor)}`, INK, 0.6, 0.45));
  return out.join("");
}

/**
 * Camps: the four elements this quadra shares, named, in a row.
 *
 * Drawn as a row rather than the rosette the first build used, for the same
 * reason the front-matter ring went: a circle of four marks big enough to read
 * needs more vertical room than the art band has, so it was clipping at the top
 * and fading into the paper wash at the bottom. A row uses the width, which is
 * the dimension this band actually has.
 */
function rosette(fns: Fn[], r: R): string {
  const out: string[] = [ground(hue(fns[0]), r)];
  const R0 = 13;
  const x0 = 26 + R0 + 14;
  const gap = (ART_W - x0 * 2) / (fns.length - 1);
  const y = 48;
  for (let i = 0; i < fns.length; i++) out.push(gesture(fns[i], x0 + gap * i, y, 17, r, 0.55));
  // One brace under all four: what makes a camp is that these are held in common.
  const bx0 = x0 - R0 - 6, bx1 = x0 + gap * (fns.length - 1) + R0 + 6;
  const by = y + R0 + 8;
  out.push(line(`M${pt(bx0, by - 4)}L${pt(bx0, by)}L${pt(bx1, by)}L${pt(bx1, by - 4)}`, INK, 0.6, 0.4));
  for (let i = 0; i < fns.length; i++) out.push(fnMark(fns[i], x0 + gap * i, y, R0));
  out.push(label(ART_W / 2, SAFE_TOP + 4, "ALL FOUR TYPES VALUE ALL FOUR", 7.5, INK, { weight: 700, o: 0.5, spread: 0.1 }));
  return out.join("");
}

/**
 * Sides: a door, open by exactly as much as that side is reachable, with the
 * four slots that stand behind it named by ROLE rather than by element — a Side
 * card is about a position in the mind, and the element filling it changes with
 * every type.
 */
function door(openness: number, r: R): string {
  // Ink, not a hue: which elements fill these four slots is different for every
  // one of the sixteen types, so no element may colour the card.
  const out: string[] = [ground(INK, r)];
  const cx = ART_W / 2;
  // Sized to the safe window, not to the card: frame, leaf and label all sit
  // between SAFE_TOP and SAFE_BOTTOM. The first build drew a 62-unit door from
  // CY, which put its lintel 1.6mm from the page edge and its caption three
  // quarters of the way into the paper wash.
  const dw = 44, dh = 24;
  const x0 = cx - dw / 2, y0 = SAFE_TOP + 8;

  out.push(`<rect x="${n(x0 - 8)}" y="${n(y0 - 8)}" width="${n(dw + 16)}" height="${n(dh + 8)}" fill="none" stroke="${INK}" stroke-width="1.7" stroke-opacity="0.75"/>`);
  const leafW = dw * (1 - openness);
  if (leafW > 0.5) {
    out.push(`<rect x="${n(x0)}" y="${n(y0)}" width="${n(leafW)}" height="${n(dh)}" fill="${PAPER}" fill-opacity="0.96" stroke="${INK}" stroke-width="1.1" stroke-opacity="0.8"/>`);
    for (let i = 0; i < 4; i++) {
      const yy = y0 + 5 + (i * (dh - 10)) / 3;
      out.push(line(`M${pt(x0 + 3.5, yy)}L${pt(x0 + leafW - 3.5, yy)}`, INK, 0.4, 0.3));
    }
    if (leafW > 10) out.push(dot(x0 + leafW - 6, CY + 4, 1.7, INK, 0.7));
  }
  if (openness === 0) {
    for (let i = 0; i < 3; i++) {
      const yy = y0 + 6 + i * 8.5;
      out.push(line(`M${pt(x0 - 13, yy + r.jitter(2))}L${pt(x0 + dw + 13, yy + r.jitter(2))}`, INK, 2.6, 0.85));
    }
  }
  // Light on the floor, proportional to the gap — it falls down the card.
  if (openness > 0) {
    const spill = 40 + openness * 90;
    out.push(
      `<path d="M${pt(x0 + leafW, y0 + dh)}L${pt(x0 + dw, y0 + dh)}L${pt(cx + spill, ART_H)}L${pt(cx - spill * 0.5, ART_H)}Z" fill="${INK}" fill-opacity="${n(0.04 + openness * 0.05)}"/>`,
    );
  }
  // The four slots behind the door, named by the position they occupy.
  // The four slots standing behind this door, by position — a Side card is about
  // a place in the mind, and which element fills it changes with every type.
  const slotY = y0 + dh / 2;
  for (let i = 0; i < 4; i++) {
    const x = 44 + i * ((ART_W - 88) / 3);
    if (Math.abs(x - cx) < dw / 2 + 13) continue;
    out.push(dot(x, slotY, 10, PAPER, 0.95));
    out.push(ring(x, slotY, 10, INK, 0.6, 0.5));
    out.push(label(x, slotY, String(i + 1), 10, INK, { weight: 700, o: 0.75 }));
  }
  out.push(label(cx, SAFE_BOTTOM - 6, openness === 1 ? "OPEN" : openness === 0 ? "BARRED" : "OPENS FROM INSIDE", 7.5, INK, { weight: 700, o: 0.62, spread: 0.12 }));
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
  // The two Leads meeting, each named — these are the worked example's two chairs.
  out.push(fnMark(fns[0], ax, CY - 4, 15));
  out.push(fnMark(fns[1], bx, CY - 4, 15));
  // The score, as a bar of exactly that length, and as a number. Both stay above
  // SAFE_BOTTOM: below it the renderer washes the art to paper, and the first
  // build printed this readout at about a third strength because of it.
  const bar = SAFE_BOTTOM - 11;
  const bw = (bx - ax) * k;
  out.push(line(`M${pt(ax, bar)}L${pt(bx, bar)}`, INK, 0.5, 0.22));
  out.push(line(`M${pt(ax, bar)}L${pt(ax + bw, bar)}`, tone, 2.6, 0.9));
  out.push(label(ART_W / 2, bar + 7, `EASE ${score}`, 8, INK, { weight: 700, o: 0.75, spread: 0.1 }));
  return out.join("");
}

/** Wheels: an octagram, one end marked open and the other closed. */
function star(fns: Fn[], r: R): string {
  const out: string[] = [ground(hue(fns[0]), r)];
  const cx = ART_W / 2, cy = (SAFE_TOP + SAFE_BOTTOM) / 2, R0 = 20;

  // Eight star points, but only four elements to name: a dyad is a type and its
  // Counterpart, and those two share one set of four ego elements. The earlier
  // build cycled `fns[i % 4]` around all eight points, which drew each element
  // twice at unrelated positions and implied eight where there are four.
  const seen: Fn[] = [];
  for (const f of fns) if (!seen.includes(f)) seen.push(f);

  for (const rot of [0, Math.PI / 4]) {
    const pts = [0, 1, 2, 3].map((i) => polar(cx, cy, R0, rot + (i / 4) * Math.PI * 2 - Math.PI / 2));
    out.push(`<path d="M${pts.map((p) => pt(...p)).join("L")}Z" fill="none" stroke="${INK}" stroke-width="0.9" stroke-opacity="0.55"/>`);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const [ex, ey] = polar(cx, cy, R0 * r.between(0.94, 1.1), a);
    out.push(line(`M${pt(cx, cy)}L${pt(ex, ey)}`, INK, 0.5, 0.28));
    out.push(dot(ex, ey, r.between(1.4, 2.4), INK, 0.4));
  }
  out.push(ring(cx, cy, R0, INK, 0.5, 0.35));
  // The two ends are not the same kind of thing: virtue open, sin filled.
  out.push(dot(cx, cy - R0, 4.2, PAPER, 1));
  out.push(ring(cx, cy - R0, 4.2, INK, 1.2, 0.9));
  out.push(dot(cx, cy + R0, 4.2, INK, 0.85));

  // The four shared elements go in the gutters either side of the star, not on
  // its points: the band is 46 units tall and a ring of four named marks wide
  // enough to read does not fit in it — the first version ran off the top edge.
  const MR = 11;
  for (let i = 0; i < seen.length; i++) {
    const x = i < 2 ? 26 + MR : ART_W - 26 - MR;
    const y = cy + (i % 2 === 0 ? -13 : 13);
    out.push(fnMark(seen[i], x, y, MR));
  }
  return out.join("");
}

/**
 * Front matter: the eight elements as the four axes they actually form.
 *
 * The first version drew them as a ring of eight with the involution chords
 * across the middle. At this size that fails twice over — the usable band is
 * 300 units wide and about 46 tall, so a ring big enough to space eight marks
 * runs off the top of the card and down into the paper wash, and the chords
 * crossing the centre read as a scribble. Four columns fit the band's shape,
 * and they teach more: each column is one element over its axis opposite,
 * which is the pairing every Bond card is about.
 */
function mark(fns: Fn[], _r: R): string {
  const out: string[] = [ground(INK, _r)];
  const R0 = 11;
  const yTop = 34, yBot = 61;
  const x0 = 26 + R0;
  const gap = (ART_W - x0 * 2) / 3;
  // One column per axis: the outward element over the inward one it opposes.
  const outward = fns.filter((f) => f[1] === "e");
  for (let i = 0; i < outward.length; i++) {
    const a = outward[i];
    const b = omega[a];
    const x = x0 + gap * i;
    out.push(line(`M${pt(x, yTop + R0)}L${pt(x, yBot - R0)}`, INK, 0.7, 0.4));
    out.push(fnMark(a, x, yTop, R0));
    out.push(fnMark(b, x, yBot, R0));
  }
  return out.join("");
}

/**
 * Bonds: two elements that answer each other, and the traffic between them.
 * Type-agnostic by construction — nobody's four letters appear, because the
 * pairing holds wherever these two elements sit.
 */
function bond(fns: Fn[], r: R): string {
  const [a, b] = fns;
  const out: string[] = [ground(hue(a), r)];
  const y = (SAFE_TOP + SAFE_BOTTOM) / 2, R0 = 19;
  const ax = 84, bx = ART_W - 84;

  out.push(gesture(a, ax, y, 20, r, 0.5));
  out.push(gesture(b, bx, y, 20, r, 0.5));
  // Two arrows, because the supply runs both ways and in equal measure.
  for (const [from, to, dy] of [[ax, bx, -9], [bx, ax, 9]] as [number, number, number][]) {
    const dir = Math.sign(to - from);
    const s = from + dir * (R0 + 5), e = to - dir * (R0 + 5);
    out.push(line(`M${pt(s, y + dy)}L${pt(e, y + dy)}`, INK, 0.8, 0.5));
    out.push(line(`M${pt(e - dir * 4.5, y + dy - 3)}L${pt(e, y + dy)}L${pt(e - dir * 4.5, y + dy + 3)}`, INK, 0.8, 0.5));
  }
  out.push(label(ART_W / 2, y, "supplies", 8, INK, { weight: 600, o: 0.62, spread: 0.06 }));
  out.push(fnMark(a, ax, y, R0));
  out.push(fnMark(b, bx, y, R0));
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
    case "door": body = door(spec.openness, r); break;
    case "channel": body = channel(spec.score, spec.fns, r); break;
    case "star": body = star(spec.fns, r); break;
    case "mark": body = mark(spec.fns, r); break;
    case "bond": body = bond(spec.fns, r); break;
  }
  return `<svg class="art" viewBox="0 0 ${ART_W} ${ART_H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
}
