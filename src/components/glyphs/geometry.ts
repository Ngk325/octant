/* ------------------------------------------------------------------ *
 * THE OCTANT GLYPH LANGUAGE — shared geometry.
 *
 * The pictorial layer of the design system: where the structural
 * diagrams (stacks, grids, wheels) show how the machine fits together,
 * the glyphs show what a concept FEELS like. Six rules, enforced here
 * and relied on by every glyph:
 *
 *   1. Original geometry only — circles, wedges, arrows, layers,
 *      beams. Nothing traced, no clip-art, no emoji.
 *   2. The app's palette, never the community's. Hue families are
 *      N=violet, S=amber, T=teal, F=rose (engine/palette.ts), WCAG-AA
 *      asserted. Semantic colour via usePalette() hex; chrome via CSS
 *      custom properties.
 *   3. Attitude is motion. Extraverted = outward (rays, fans, arrows
 *      out); intraverted = inward (cores, beams, arrows in).
 *   4. Rank is size. Lead > Support > Delight > Cave at one fixed
 *      ratio, everywhere a stack is drawn small.
 *   5. People are geometry. A person is a circle head over a shoulder
 *      arc, ink-coloured; a crowd is a row of them, quieter.
 *   6. Derived, not authored. A glyph that names a type, function or
 *      animal computes its shape from the engine.
 * ------------------------------------------------------------------ */

/** Rule 4: the rank-to-size ratio, Lead → Cave. */
export const RANK_RATIO = [1, 0.78, 0.56, 0.42] as const;

/** Is this function extraverted? Rule 3 decides everything else. */
export const outward = (fn: string) => fn[1] === "e";

/**
 * Rule 5: one person, as SVG path fragments — a head circle and a
 * shoulder arc, centred at (cx, baseline at cy). Scale ~= head radius.
 */
export function person(cx: number, cy: number, r: number): { head: { cx: number; cy: number; r: number }; shoulders: string } {
  return {
    head: { cx, cy: cy - r * 2.1, r },
    shoulders: `M ${cx - r * 1.7} ${cy} Q ${cx} ${cy - r * 1.9}, ${cx + r * 1.7} ${cy}`,
  };
}

/** Points on a circle, for rings of dots and radiating rays. */
export function ring(cx: number, cy: number, r: number, n: number, phase = -Math.PI / 2): { x: number; y: number }[] {
  return Array.from({ length: n }, (_, i) => {
    const a = phase + (i / n) * Math.PI * 2;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
}

/** An arrowhead path pointing along the (dx, dy) direction, tip at (x, y). */
export function arrowhead(x: number, y: number, dx: number, dy: number, size = 6): string {
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const px = -uy, py = ux; // perpendicular
  return `M ${x} ${y} L ${x - ux * size + px * size * 0.6} ${y - uy * size + py * size * 0.6} ` +
         `L ${x - ux * size - px * size * 0.6} ${y - uy * size - py * size * 0.6} Z`;
}
