import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { RATE_CARD_ASSET } from "../src/worker/enquiry";

/* ------------------------------------------------------------------ *
 * THE COMMITTED RATE CARD.
 *
 * src/worker/enquiry.ts mails this PDF to every partner who asks, read
 * back out of the asset binding. There is no Chromium in a Worker, so
 * the built file has to be committed — and a committed binary is the
 * classic thing that goes stale silently. Its text lives in compressed
 * streams, so it cannot even be grepped for the validity date.
 *
 * So the guard is on the SOURCE instead: scripts/build-rate-card.mjs
 * records the hash of the HTML it printed, and this fails the moment
 * the HTML moves without a rebuild. The failure message is the fix.
 * ------------------------------------------------------------------ */

const ROOT = join(__dirname, "..");
const SOURCE = join(ROOT, "docs", "partner-rate-card.html");
const RECORDED = join(ROOT, "docs", "partner-rate-card.source.sha256");
const PDF = join(ROOT, "public", RATE_CARD_ASSET.replace(/^\//, ""));

describe("the partner rate card that actually ships", () => {
  it("is committed where vite will copy it into the asset build", () => {
    const size = statSync(PDF).size;
    // Big enough to be the real document, small enough that a runaway
    // font embed or a duplicated page would show up here.
    expect(size).toBeGreaterThan(100_000);
    expect(size).toBeLessThan(2_000_000);
    expect(readFileSync(PDF).subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("is still exactly two pages", () => {
    const raw = readFileSync(PDF).toString("latin1");
    expect(Number(/\/Count\s+(\d+)/.exec(raw)?.[1])).toBe(2);
  });

  it("was built from the current docs/partner-rate-card.html", () => {
    const actual = createHash("sha256").update(readFileSync(SOURCE)).digest("hex");
    const recorded = readFileSync(RECORDED, "utf8").trim();
    expect(
      actual,
      "The rate-card HTML changed without a rebuild, so partners would be " +
        "emailed the old numbers. Run `npm run rate-card`, then commit " +
        "public/octant-partner-rate-card.pdf and docs/partner-rate-card.source.sha256.",
    ).toBe(recorded);
  });

  it("keeps the private numbers out of the public partner page's source", () => {
    // The card is the ONLY place these live. If one of them ever appears in
    // src/worker/, the public/private split has collapsed.
    const partners = readFileSync(join(ROOT, "src", "worker", "partners.ts"), "utf8");
    const enquiry = readFileSync(join(ROOT, "src", "worker", "enquiry.ts"), "utf8");
    for (const number of ["$18", "$15", "$12", "$10", "$750", "$36,000", "$3,000"]) {
      expect(partners).not.toContain(number);
      expect(enquiry).not.toContain(number);
    }
  });
});
