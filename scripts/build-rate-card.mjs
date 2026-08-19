#!/usr/bin/env node
/**
 * Prints the private partner rate card to PDF.
 *
 *   node scripts/build-rate-card.mjs   → dist-partner/octant-partner-rate-card.pdf
 *
 * The public partner page lives in the Worker (src/worker/partners.ts) and
 * carries no numbers on purpose. This is the other half: the rates, sent
 * after an enquiry and before an engagement. It is a static document rather
 * than a derived one, so this script only prints it -- but it asserts the
 * page count, because a rate card that silently grows to four pages has
 * stopped being the thing it was commissioned to be.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "docs", "partner-rate-card.html");
const OUT = join(ROOT, "dist-partner");
const DEST = join(OUT, "octant-partner-rate-card.pdf");
const MAX_PAGES = 2;

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

const bin = findChrome();
mkdirSync(OUT, { recursive: true });

execFileSync(
  bin,
  [
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--no-pdf-header-footer",
    // The webfonts are fetched at print time; give them a moment to land
    // before the page is captured, or the card prints in Georgia.
    "--virtual-time-budget=5000",
    `--print-to-pdf=${DEST}`,
    `file://${SRC}`,
  ],
  { stdio: ["ignore", "ignore", "inherit"] },
);

const bytes = readFileSync(DEST);
const pages = (bytes.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
console.log(`octant-partner-rate-card.pdf: ${pages} pages, ${(bytes.length / 1024).toFixed(0)} KB`);

if (pages > MAX_PAGES) {
  console.error(
    `\nFAIL: ${pages} pages, and this document exists to be ${MAX_PAGES}. ` +
      `Cut content in docs/partner-rate-card.html rather than raising the cap.`,
  );
  process.exit(1);
}
