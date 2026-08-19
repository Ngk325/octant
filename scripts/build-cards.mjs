#!/usr/bin/env node
/**
 * Builds the Octant card deck as print-ready PDFs.
 *
 *   node scripts/build-cards.mjs            → dist-cards/
 *   node scripts/build-cards.mjs --html     → HTML only, no browser
 *
 * The deck itself is derived TypeScript (src/cards/), so this script only
 * does three things: load those modules, ask a headless Chromium whether any
 * card's text overran its safe area, and print the two PDFs.
 *
 * Vite is used purely as the TypeScript loader — it is already a dev
 * dependency, and this keeps the deck importable by the test suite rather
 * than trapped in a build script.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "dist-cards");
const HTML_ONLY = process.argv.includes("--html");

/** Chromium, wherever this machine keeps it. */
function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/opt/pw-browsers/chromium",
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
  return null;
}

const CHROME_FLAGS = [
  "--headless",
  "--disable-gpu",
  "--no-sandbox",
  "--no-first-run",
  "--disable-dev-shm-usage",
  "--hide-scrollbars",
];

function chrome(bin, args) {
  // Chromium is noisy on a headless box with no dbus; that chatter is not an error.
  return execFileSync(bin, [...CHROME_FLAGS, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    maxBuffer: 256 * 1024 * 1024,
  });
}

/** Ask the browser to measure every card body and report the ones that overran. */
function checkOverflow(bin, htmlPath) {
  const dom = chrome(bin, ["--virtual-time-budget=8000", "--dump-dom", `file://${htmlPath}`]);
  const m = dom.match(/<title>OVERFLOW:(.*?)<\/title>/s);
  if (!m) return null;
  return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
}

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "warn",
  configFile: false,
});

try {
  const { deck } = await server.ssrLoadModule("/src/cards/deck.ts");
  const { backDocument, cardsDocument, sheetsDocument, CARD_PAGE, TRIM } = await server.ssrLoadModule("/src/cards/render.ts");

  const cards = deck();
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const files = {
    cards: join(OUT, "octant-cards.html"),
    sheets: join(OUT, "octant-sheets.html"),
    back: join(OUT, "octant-back.html"),
    probe: join(OUT, "probe.html"),
  };
  writeFileSync(files.cards, cardsDocument(cards));
  writeFileSync(files.sheets, sheetsDocument(cards));
  writeFileSync(files.back, backDocument());
  writeFileSync(files.probe, cardsDocument(cards, true));

  console.log(`deck: ${cards.length} cards`);
  console.log(`card page: ${CARD_PAGE.w} x ${CARD_PAGE.h} mm (trim ${TRIM.w} x ${TRIM.h})`);

  if (HTML_ONLY) {
    console.log(`html written to ${OUT}`);
    process.exit(0);
  }

  const bin = findChrome();
  if (!bin) {
    console.error("No Chromium found. Set CHROME_PATH, or run with --html and print the HTML yourself.");
    process.exit(1);
  }

  const over = checkOverflow(bin, files.probe);
  if (over === null) {
    console.warn("overflow probe: no result (the page did not report)");
  } else if (over.length) {
    console.error(`overflow: ${over.length} card(s) overran the safe area`);
    for (const o of over) console.error(`  ${o.id} by ${o.by}px`);
    process.exitCode = 1;
  } else {
    console.log("overflow: none — every card fits its safe area");
  }

  for (const [name, src] of [["octant-cards.pdf", files.cards], ["octant-sheets.pdf", files.sheets], ["octant-back.pdf", files.back]]) {
    const dest = join(OUT, name);
    chrome(bin, ["--no-pdf-header-footer", `--print-to-pdf=${dest}`, `file://${src}`]);
    const bytes = readFileSync(dest);
    const pages = (bytes.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
    console.log(`${name}: ${pages} pages, ${(bytes.length / 1024 / 1024).toFixed(2)} MB`);
  }
  console.log(`written to ${OUT}`);
} finally {
  await server.close();
}
