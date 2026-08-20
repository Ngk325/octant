#!/usr/bin/env node
/**
 * Prints the private partner rate card to PDF.
 *
 *   node scripts/build-rate-card.mjs             → dist-partner/octant-partner-rate-card.pdf
 *   node scripts/build-rate-card.mjs --no-fonts  → local stacks, for an offline build
 *
 * The public partner page lives in the Worker (src/worker/partners.ts) and
 * carries no numbers on purpose. This is the other half: the rates, sent
 * after an enquiry and before an engagement.
 *
 * Two things this script does beyond printing, both because the first
 * version of this document failed silently at each of them:
 *
 *   1. It EMBEDS the brand faces rather than linking them. A <link> to
 *      Google Fonts is fetched by the browser at print time, and when that
 *      fetch fails the page prints in fallbacks without saying so -- which
 *      is exactly what happened, and the resulting PDF looked wrong with no
 *      error anywhere. Fonts are fetched once, cached, inlined as data URIs,
 *      and a failure is loud. Newsreader and Inter are both SIL Open Font
 *      License, which permits embedding.
 *
 *   2. It ASSERTS the page count. A rate card that quietly grows to four
 *      pages has stopped being the thing it was commissioned to be.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "docs", "partner-rate-card.html");
const OUT = join(ROOT, "dist-partner");
const CACHE = join(OUT, "fonts.css");
const DEST = join(OUT, "octant-partner-rate-card.pdf");
const MAX_PAGES = 2;
const NO_FONTS = process.argv.includes("--no-fonts");

const GOOGLE_CSS =
  "https://fonts.googleapis.com/css2" +
  "?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600" +
  "&family=Inter:wght@400;500;600&display=swap";

/** The faces the card actually uses. Anything else is weight we don't ship. */
const WANTED = new Set(["Newsreader:400", "Newsreader:500", "Newsreader:600", "Inter:400", "Inter:500", "Inter:600"]);

/** Chromium, wherever this machine keeps it. Same list as build-cards.mjs. */
function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/opt/pw-browsers/chromium",
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean);
  for (const c of candidates) {
    try {
      statSync(c);
      return c;
    } catch {}
  }
  throw new Error("No Chromium found. Set CHROME_PATH.");
}

/**
 * A FULL modern User-Agent, and it matters: Google serves this stylesheet by
 * browser capability, and a short or unfamiliar UA gets the legacy path --
 * TrueType files with no unicode-range blocks, so the latin-subset parse below
 * finds nothing. Shortening this string silently breaks the build.
 */
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/120.0.0.0 Safari/537.36";

const curl = (url, binary) =>
  execFileSync("curl", ["-sS", "--fail", "--max-time", "30", "-A", UA, url], {
    maxBuffer: 32 * 1024 * 1024,
    encoding: binary ? "buffer" : "utf8",
  });

/**
 * Latin-subset @font-face rules with the woff2 inlined. Cached, because the
 * bytes never change and a rebuild should not need the network.
 */
function fontCss() {
  if (existsSync(CACHE)) return readFileSync(CACHE, "utf8");
  const sheet = curl(GOOGLE_CSS, false);
  if (!/format\('woff2'\)/.test(sheet)) {
    throw new Error("stylesheet came back without woff2 — the User-Agent was not accepted");
  }
  const blocks = [...sheet.matchAll(/\/\* latin \*\/\s*(@font-face \{[\s\S]*?\})/g)].map((m) => m[1]);
  const faces = [];
  for (const b of blocks) {
    const fam = /font-family: '([^']+)'/.exec(b)?.[1];
    const wt = /font-weight: (\d+)/.exec(b)?.[1];
    const url = /url\((https:\/\/[^)]+)\)/.exec(b)?.[1];
    if (!fam || !wt || !url || !WANTED.has(`${fam}:${wt}`)) continue;
    const raw = curl(url, true);
    if (raw.length < 500) throw new Error(`${fam} ${wt} came back empty`);
    faces.push(
      `@font-face{font-family:'${fam}';font-style:normal;font-weight:${wt};` +
        `src:url(data:font/woff2;base64,${raw.toString("base64")}) format('woff2');}`,
    );
  }
  if (faces.length < WANTED.size) {
    throw new Error(`only ${faces.length} of ${WANTED.size} faces resolved`);
  }
  writeFileSync(CACHE, faces.join("\n"));
  return faces.join("\n");
}

mkdirSync(OUT, { recursive: true });

let css = "";
if (!NO_FONTS) {
  try {
    css = fontCss();
  } catch (err) {
    console.error(
      `\nFAIL: could not assemble the brand faces — ${err.message}\n` +
        `The card would print in fallback fonts and look wrong without saying so, ` +
        `which is the bug this check exists to prevent.\n` +
        `Re-run with --no-fonts to accept local stacks deliberately.`,
    );
    process.exit(1);
  }
}

const html = readFileSync(SRC, "utf8").replace("<!--FONTS-->", css ? `<style>${css}</style>` : "");
const staged = join(OUT, "rate-card.staged.html");
writeFileSync(staged, html);

execFileSync(
  findChrome(),
  [
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--no-pdf-header-footer",
    "--virtual-time-budget=4000",
    `--print-to-pdf=${DEST}`,
    `file://${staged}`,
  ],
  { stdio: ["ignore", "ignore", "pipe"] },
);

const bytes = readFileSync(DEST);
/**
 * Page count from the page tree's /Count, cross-checked against one /MediaBox
 * per page. Counting "/Type /Page" is the obvious approach and is the fragile
 * one -- it needs a negative lookahead to avoid matching /Type /Pages, and it
 * lands differently depending on how the writer compressed its objects.
 */
const raw = bytes.toString("latin1");
const declared = Number(/\/Count\s+(\d+)/.exec(raw)?.[1] ?? NaN);
const boxes = (raw.match(/\/MediaBox/g) || []).length;
if (Number.isNaN(declared) || declared !== boxes) {
  console.error(`\nFAIL: page count is ambiguous — /Count says ${declared}, ${boxes} MediaBoxes.`);
  process.exit(1);
}
const pages = declared;
console.log(
  `octant-partner-rate-card.pdf: ${pages} pages, ${(bytes.length / 1024).toFixed(0)} KB` +
    `${css ? "" : "  (local font stacks)"}`,
);

if (pages !== MAX_PAGES) {
  console.error(
    `\nFAIL: ${pages} pages, and this document exists to be exactly ${MAX_PAGES}. ` +
      `Adjust docs/partner-rate-card.html rather than raising the cap.`,
  );
  process.exit(1);
}
