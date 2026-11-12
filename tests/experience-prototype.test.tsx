// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import ExperiencePrototype from "../src/views/ExperiencePrototype";
import { ThemeProvider } from "../src/components/Theme";
import { TYPES, stack } from "../src/engine/core";
import { SIDE_ORDER, sides } from "../src/engine/sides";

let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
beforeEach(async () => {
  localStorage.clear();
  host = document.createElement("div");
  document.body.append(host);
  await act(async () => {
    root = createRoot(host);
    root.render(<MemoryRouter><ThemeProvider><ExperiencePrototype /></ThemeProvider></MemoryRouter>);
  });
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});

describe("the visual experience uses the canonical engine", () => {
  it.each(TYPES)("%s: every side, gateway and visible assignment agrees with the engine", async type => {
    const select = host.querySelector("select")!;
    await act(async () => {
      select.value = type;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    for (const key of SIDE_ORDER) {
      const model = sides(type)[key];
      const button = [...host.querySelectorAll<HTMLButtonElement>(".xp-side-picker button")].find(b => b.textContent?.includes(model.name))!;
      await act(async () => button.click());
      expect(button.getAttribute("aria-pressed")).toBe("true");
      const rows = [...host.querySelectorAll(".xp-assignments li")];
      expect(rows).toHaveLength(4);
      model.slots.forEach((slot, i) => {
        expect(rows[i].textContent).toBe(`${slot.fn}${slot.egoSlot} → ${slot.role}`);
        expect(stack(model.type)[i]).toBe(slot.fn);
      });
      expect(host.querySelector(".xp-gateway")?.textContent).toContain(`${model.gateway.fn}${model.gateway.egoSlot} → Lead`);
      expect(host.querySelector(".xp-figure desc")?.textContent).toContain(`${model.slots[0].fn}: ${model.slots[0].egoSlot}`);
    }
    expect(localStorage.length).toBe(0);
  });

  it("clears the worked Showman example when the selected type changes", async () => {
    const superego = host.querySelectorAll<HTMLButtonElement>(".xp-side-picker button")[3];
    await act(async () => superego.click());
    expect(host.textContent).toContain("A Showman example.");
    const select = host.querySelector("select")!;
    await act(async () => { select.value = "INFJ"; select.dispatchEvent(new Event("change", { bubbles: true })); });
    expect(host.textContent).not.toContain("A Showman example.");
    expect(host.querySelector(".xp-story")?.textContent).toContain("ISTJ");
  });
});
