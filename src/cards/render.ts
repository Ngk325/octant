import { artFor, backArt } from "./art";
import type { Card, Chip } from "./deck";
import { FN_COLOR } from "../engine/palette";

/* ------------------------------------------------------------------ *
 * PRINT RENDERING
 *
 * Two documents out of the same card list:
 *
 *   cardsDocument()  one card per page at 69.09 x 94.23 mm — the bleed
 *                    size print-on-demand houses ask for (2.72 x 3.71in,
 *                    3.04mm bleed around a 63 x 88mm trim). Art runs off
 *                    all four edges; nothing that must survive the guillotine
 *                    sits within 6mm of one.
 *   sheetsDocument() A4, nine cards to a page at trim size with crop marks,
 *                    for cutting a proof at home.
 *
 * Everything is measured in millimetres and typeset in points, because
 * that is what the press works in. No web units appear below.
 * ------------------------------------------------------------------ */

/** Trim size — the finished card. */
export const TRIM = { w: 63, h: 88 };
/**
 * Bleed per edge. Not square: the standard poker card page is 2.72 x 3.71in
 * (69.09 x 94.23mm) around a 63 x 88mm trim, which is 3.045mm at the sides and
 * 3.117mm top and bottom. Rounding both to one number would put the page
 * 0.14mm short of the spec, so both numbers are kept.
 */
export const BLEED = { x: 3.045, y: 3.117 };
/** The page a single card is printed on: trim plus bleed all round. */
export const CARD_PAGE = { w: TRIM.w + BLEED.x * 2, h: TRIM.h + BLEED.y * 2 };
/** How far in from the bleed edge text is allowed to start. */
export const SAFE = 6.5;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ------------------------------- styles ------------------------------- */

/**
 * Newsreader and Inter are the app's faces but are not installed on a build
 * machine, so the stacks below fall through to what is: a Charter/DejaVu serif
 * for the body and a grotesque for the labels. Both embed into the PDF.
 */
const SERIF = `"Newsreader", "Charter", "Bitstream Charter", "DejaVu Serif", Georgia, serif`;
const SANS = `"Inter", "DejaVu Sans", "Liberation Sans", system-ui, sans-serif`;

const INK = "#241F19";
const INK_2 = "#4A4238";
const MUTED = "#6F6353";
const PAPER = "#FDFCFA";
const RULE = "#DED7C9";

function cardCss(): string {
  const fnVars = Object.entries(FN_COLOR.light).map(([k, v]) => `--fn-${k}:${v};`).join("");
  return `
:root{${fnVars}--ink:${INK};--ink2:${INK_2};--muted:${MUTED};--paper:${PAPER};--rule:${RULE};}
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.card{position:relative;overflow:hidden;background:var(--paper);color:var(--ink);
  font-family:${SERIF};display:block;font-size:6.5pt;line-height:1.26;}
.artwrap{position:absolute;inset:0;overflow:hidden;}
.art{width:100%;height:100%;display:block;}
/* The art runs the whole card; below the band it is washed back to near-paper,
   so it reads as tone under the text rather than as picture behind it. */
.artwrap::after{content:"";position:absolute;inset:0;
  background:linear-gradient(to bottom,rgba(253,252,250,0) 0,rgba(253,252,250,0) 17mm,
  rgba(253,252,250,.965) 25mm,rgba(253,252,250,.965) 100%);}
.body{position:absolute;left:${SAFE}mm;right:${SAFE}mm;top:22.5mm;bottom:${SAFE}mm;
  display:flex;flex-direction:column;}
.head{display:flex;justify-content:space-between;align-items:baseline;
  font-family:${SANS};font-size:5.1pt;letter-spacing:.16em;text-transform:uppercase;
  color:var(--muted);border-bottom:.24mm solid var(--rule);padding-bottom:.7mm;margin-bottom:1.5mm;}
h1{font-size:14pt;line-height:1.02;font-weight:600;letter-spacing:-.01em;}
.sub{font-family:${SANS};font-size:5.7pt;line-height:1.25;color:var(--ink2);
  margin-top:.8mm;letter-spacing:.005em;}
.lede{font-size:7pt;line-height:1.29;margin-top:1.3mm;color:var(--ink);}
.chips{display:flex;flex-wrap:wrap;gap:.8mm;margin-top:1.4mm;list-style:none;}
.chip{font-family:${SANS};font-size:5.2pt;line-height:1;padding:.7mm 1.1mm;
  border:.2mm solid currentColor;border-radius:.7mm;color:var(--muted);white-space:nowrap;}
.chip.dim{opacity:.55;border-style:dashed;}
.strip{display:flex;gap:.5mm;margin-top:1.6mm;list-style:none;}
/* Cells size to their labels (flex-basis auto), so "Blind spot" holds one line
   instead of stacking — and the label runs at the deck's 4.5pt chrome floor,
   which its first printing quietly undercut at 3.9pt. */
.strip li{flex:1 1 auto;text-align:center;border-top:.5mm solid currentColor;
  padding:.6mm .5mm 0;color:var(--muted);}
.strip .n{display:block;font-family:${SANS};font-size:4.5pt;letter-spacing:.01em;
  white-space:nowrap;color:var(--muted);line-height:1;margin-bottom:.4mm;}
.strip .f{display:block;font-family:${SANS};font-size:6pt;font-weight:600;line-height:1;color:currentColor;}
.strip li.dim{border-top-style:dotted;border-top-width:.3mm;opacity:.6;}
.blocks{padding-top:1.4mm;}
.blocks .b{margin-top:1mm;}
.blocks .b:first-child{margin-top:0;}
dt{font-family:${SANS};font-size:4.7pt;letter-spacing:.13em;text-transform:uppercase;
  color:var(--muted);margin-bottom:.35mm;}
/* An element code is a proper name: "Ne", never "NE". Labels are uppercased
   as chrome, so any code inside one rides in a span that opts back out. */
dt .code{text-transform:none;}
dd{font-size:6.5pt;line-height:1.22;color:var(--ink2);}
.foot{font-family:${SANS};font-size:4.5pt;line-height:1.25;color:var(--muted);
  border-top:.24mm solid var(--rule);padding-top:.9mm;margin-top:auto;}
.card.dense .blocks .b{margin-top:1.05mm;}
/* A Wiring runs four blocks where every other suit runs three; it pays for the
   fourth with tighter leading, not smaller type. */
.card.type .blocks .b{margin-top:.7mm;}
.card.type .lede{margin-top:1mm;}
.card.type .strip{margin-top:1.2mm;}
.card.dense dt{display:inline;margin:0;}
.card.dense dt::after{content:" · ";letter-spacing:0;}
.card.dense dd{display:inline;}
.card.front h1{font-size:18pt;}
.card.front .lede{font-size:7pt;}
.card.front dd{font-size:5.7pt;line-height:1.22;}
.card.front .blocks .b{margin-top:1mm;}
/* A dense front card is an eight-item list — the two longest faces in the deck.
   They get their own step down, and the wide rule comes last so a long title
   never keeps the 18pt front size and wraps the list off the card. */
.card.front.dense dt,.card.front.dense dd{font-size:5.35pt;line-height:1.2;}
.card.front.dense .blocks .b{margin-top:.72mm;}
.card.front.dense .lede{font-size:6.4pt;}
.card.wide h1{font-size:11.4pt;}
`;
}

/* ------------------------------- pieces ------------------------------- */

function chipHtml(c: Chip): string {
  const style = c.fn ? ` style="color:var(--fn-${c.fn})"` : "";
  return `<li class="chip${c.dim ? " dim" : ""}"${style}>${esc(c.text)}</li>`;
}

/**
 * A block label, with any element code exempted from the dt uppercase. The
 * first printing set "Ne" in a label as "NE" — a different string from the
 * one every mark, chip and body line prints, on the very card that teaches
 * the alphabet.
 */
const dtHtml = (label: string) =>
  esc(label).replace(/\b(N[ei]|S[ei]|T[ei]|F[ei])\b/g, '<span class="code">$1</span>');

function stripHtml(chips: Chip[]): string {
  const cells = chips
    .map((c) => {
      const style = c.fn ? ` style="color:var(--fn-${c.fn})"` : "";
      return `<li class="${c.dim ? "dim" : ""}"${style}><span class="n">${esc(c.note ?? "")}</span><span class="f">${esc(c.text)}</span></li>`;
    })
    .join("");
  return `<ul class="strip">${cells}</ul>`;
}

/** One card, as an absolutely-positioned block. Sizing is the caller's job. */
export function cardHtml(card: Card): string {
  const isStrip = card.chips.some((c) => c.note);
  const wide = card.title.length > 13;
  return (
    `<article class="card ${card.suit}${wide ? " wide" : ""}${card.dense ? " dense" : ""}" data-id="${esc(card.id)}">` +
    `<div class="artwrap">${artFor(card.id, card.art)}</div>` +
    `<div class="body">` +
    `<div class="head"><span>${esc(card.suitLabel)}</span><span>${card.n} / ${card.of}</span></div>` +
    `<h1>${esc(card.title)}</h1>` +
    `<p class="sub">${esc(card.subtitle)}</p>` +
    `<p class="lede">${esc(card.lede)}</p>` +
    (card.chips.length ? (isStrip ? stripHtml(card.chips) : `<ul class="chips">${card.chips.map(chipHtml).join("")}</ul>`) : "") +
    `<dl class="blocks">` +
    card.blocks.map((b) => `<div class="b"><dt>${dtHtml(b.label)}</dt><dd>${esc(b.text)}</dd></div>`).join("") +
    `</dl>` +
    `<p class="foot">${esc(card.footer)}</p>` +
    `</div></article>`
  );
}

/**
 * Reports any card whose text overran its safe area, by setting the document
 * title. Read back with chromium's --dump-dom; see scripts/build-cards.mjs.
 */
/**
 * Reports any card whose content ran past its safe area, by setting the document
 * title. Read back with chromium's --dump-dom; see scripts/build-cards.mjs.
 *
 * It measures the bottom edge of the last child against the bottom edge of the
 * body, NOT scrollHeight: the footer is pushed down with `margin-top:auto`, and
 * a flex auto margin can carry content out of its container without ever
 * creating scrollable overflow. Measuring scrollHeight here silently passed
 * cards whose footer was being guillotined.
 */
const OVERFLOW_PROBE = `<script>
document.title = "OVERFLOW:" + JSON.stringify([...document.querySelectorAll(".body")]
  .map((b) => {
    const limit = b.getBoundingClientRect().bottom;
    const last = Math.max(...[...b.children].map((c) => c.getBoundingClientRect().bottom));
    return { id: b.closest(".card").dataset.id, by: Math.round(last - limit) };
  })
  .filter((o) => o.by > 0));
</script>`;

function page(title: string, css: string, body: string, probe: boolean): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>${cardCss()}${css}</style></head><body>${body}${probe ? OVERFLOW_PROBE : ""}</body></html>`;
}

/* ----------------------------- documents ----------------------------- */

/** One card per page at bleed size — the file a print-on-demand house wants. */
export function cardsDocument(cards: Card[], probe = false): string {
  const css = `
@page{size:${CARD_PAGE.w}mm ${CARD_PAGE.h}mm;margin:0;}
html,body{background:${PAPER};}
.card{width:${CARD_PAGE.w}mm;height:${CARD_PAGE.h}mm;break-after:page;}
.card:last-child{break-after:auto;}`;
  return page("Octant — cards, bleed size", css, cards.map(cardHtml).join(""), probe);
}

/**
 * The deck's back, as its own single-page document — print-on-demand houses
 * take the back as a separate upload from the fronts. Full-bleed art, no body
 * text, and no paper wash: the wash exists to keep art from fighting copy,
 * and a back has no copy to protect.
 */
export function backDocument(): string {
  const css = `
@page{size:${CARD_PAGE.w}mm ${CARD_PAGE.h}mm;margin:0;}
html,body{background:${PAPER};}
.card{width:${CARD_PAGE.w}mm;height:${CARD_PAGE.h}mm;}
.card.back .artwrap::after{background:none;}`;
  const body = `<article class="card back" data-id="back"><div class="artwrap">${backArt()}</div></article>`;
  return page("Octant — card back, bleed size", css, body, false);
}

/** Nine to an A4 page at trim size, with crop marks, for a home proof. */
export function sheetsDocument(cards: Card[], probe = false): string {
  const cols = 3, rows = 3;
  const gridW = cols * TRIM.w, gridH = rows * TRIM.h;
  const mx = (210 - gridW) / 2, my = (297 - gridH) / 2;
  const css = `
@page{size:210mm 297mm;margin:0;}
html,body{background:#fff;}
.sheet{position:relative;width:210mm;height:297mm;break-after:page;}
.sheet:last-child{break-after:auto;}
.grid{position:absolute;left:${mx}mm;top:${my}mm;width:${gridW}mm;height:${gridH}mm;
  display:grid;grid-template-columns:repeat(${cols},${TRIM.w}mm);grid-template-rows:repeat(${rows},${TRIM.h}mm);}
.cell{position:relative;width:${TRIM.w}mm;height:${TRIM.h}mm;overflow:hidden;}
.cell .card{position:absolute;left:${-BLEED.x}mm;top:${-BLEED.y}mm;width:${CARD_PAGE.w}mm;height:${CARD_PAGE.h}mm;}
.mark{position:absolute;background:#000;}
.mark.v{width:.12mm;height:4mm;}
.mark.h{height:.12mm;width:4mm;}`;

  const marks: string[] = [];
  for (let c = 0; c <= cols; c++) {
    const x = mx + c * TRIM.w;
    marks.push(`<i class="mark v" style="left:${x}mm;top:${my - 5}mm"></i>`);
    marks.push(`<i class="mark v" style="left:${x}mm;top:${my + gridH + 1}mm"></i>`);
  }
  for (let r = 0; r <= rows; r++) {
    const y = my + r * TRIM.h;
    marks.push(`<i class="mark h" style="top:${y}mm;left:${mx - 5}mm"></i>`);
    marks.push(`<i class="mark h" style="top:${y}mm;left:${mx + gridW + 1}mm"></i>`);
  }

  const sheets: string[] = [];
  for (let i = 0; i < cards.length; i += cols * rows) {
    const cells = cards
      .slice(i, i + cols * rows)
      .map((c) => `<div class="cell">${cardHtml(c)}</div>`)
      .join("");
    sheets.push(`<div class="sheet">${marks.join("")}<div class="grid">${cells}</div></div>`);
  }
  return page("Octant — proof sheets, A4", css, sheets.join(""), probe);
}
