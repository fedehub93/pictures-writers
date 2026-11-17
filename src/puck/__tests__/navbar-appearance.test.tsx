// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

import type { NavItemUi } from "../blocks/NavbarBlock/types";
import { NavbarMobileMenu } from "../blocks/NavbarBlock/ui/mobile-menu";

const stylesheet = readFileSync(
  resolve(process.cwd(), "src/puck/styles/puck-base.css"),
  "utf8",
);

const ITEMS: NavItemUi[] = [
  { type: "link", label: "Home", link: { label: "Home", href: "/" } },
];

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

async function openSheet(appearanceVars: Record<string, string>) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  await act(async () => {
    root!.render(
      <NavbarMobileMenu
        items={ITEMS}
        pathname="/"
        appearanceVars={appearanceVars}
      />,
    );
  });

  const trigger = container.querySelector<HTMLButtonElement>(
    'button[aria-label="Open menu"]',
  );

  expect(trigger).not.toBeNull();

  await act(async () => {
    trigger!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  document.body.innerHTML = "";
  root = null;
  container = null;
});

describe("NavbarBlock appearance defaults", () => {
  it("keeps today's sizes and gaps in the stylesheet", () => {
    expect(stylesheet).toContain("font-size: var(--nav-fs-d, 14px)");
    expect(stylesheet).toContain("gap: var(--nav-gap-d, 8px)");
    expect(stylesheet).toContain(
      "font-size: var(--nav-fs-m, var(--nav-fs-t, var(--nav-fs-d, 16px)))",
    );
    expect(stylesheet).toContain(
      "gap: var(--nav-gap-m, var(--nav-gap-t, var(--nav-gap-d, 4px)))",
    );
  });

  it("drives the labels directly so nested links are not pinned by a wrapper", () => {
    expect(stylesheet).toContain(".puck-nav .puck-nav-label");
    expect(stylesheet).toContain(".puck-nav-sheet .puck-nav-label");
  });

  it("uses the same media ladder as the rest of the stylesheet", () => {
    expect(stylesheet).toContain(
      "font-size: var(--nav-fs-t, var(--nav-fs-d, 14px))",
    );
    expect(stylesheet).toContain(
      "gap: var(--nav-gap-t, var(--nav-gap-d, 8px))",
    );
    expect(stylesheet).toContain(
      "font-size: var(--nav-fs-m, var(--nav-fs-t, var(--nav-fs-d, 14px)))",
    );
    expect(stylesheet).toContain(
      "gap: var(--nav-gap-m, var(--nav-gap-t, var(--nav-gap-d, 8px)))",
    );
  });
});

describe("NavbarBlock mobile sheet appearance", () => {
  it("receives the navigation style variables on the portaled content", async () => {
    await openSheet({ "--nav-fs-m": "20px", "--nav-gap-m": "12px" });

    const sheet = document.querySelector<HTMLElement>(
      '[data-slot="sheet-content"]',
    );

    expect(sheet).not.toBeNull();
    expect(sheet!.classList.contains("puck-nav-sheet")).toBe(true);
    expect(sheet!.style.getPropertyValue("--nav-fs-m")).toBe("20px");
    expect(sheet!.style.getPropertyValue("--nav-gap-m")).toBe("12px");
  });

  it("still opens without authored values, leaving the defaults to the stylesheet", async () => {
    await openSheet({});

    const sheet = document.querySelector<HTMLElement>(
      '[data-slot="sheet-content"]',
    );

    expect(sheet).not.toBeNull();
    expect(sheet!.style.getPropertyValue("--nav-fs-m")).toBe("");
    expect(sheet!.style.getPropertyValue("--nav-gap-m")).toBe("");
    expect(sheet!.querySelector(".puck-nav-sheet-list")).not.toBeNull();
  });
});
