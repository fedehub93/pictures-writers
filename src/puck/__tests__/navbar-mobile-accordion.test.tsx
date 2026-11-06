// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/blog/",
}));

import type { NavItemUi } from "../blocks/NavbarBlock/types";
import { NavbarMobileList } from "../blocks/NavbarBlock/ui/mobile-menu";

const MEGA_PANEL_COLUMN: NavItemUi = {
  type: "column",
  label: "Risorse",
  items: [
    {
      label: "Formazione",
      description: "Scuole e corsi di sceneggiatura.",
      icon: { name: "school" },
      link: { label: "Formazione", href: "/blog/scuole-di-sceneggiatura/" },
    },
    {
      label: "Prossimamente",
      link: { type: "page", pageId: "draft" },
    },
  ],
};

const LEGACY_COLUMN: NavItemUi = {
  type: "column",
  label: "Risorse",
  items: [{ label: "Blog", link: { label: "Blog", href: "/blog/" } }],
};

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

function mount(items: NavItemUi[]) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root!.render(<NavbarMobileList items={items} pathname="/blog/" />);
  });

  return container;
}

async function openColumn(scope: HTMLDivElement, label: string) {
  const trigger = Array.from(scope.querySelectorAll("button")).find((button) =>
    button.textContent?.includes(label),
  );

  expect(trigger).toBeDefined();

  await act(async () => {
    trigger!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = null;
  container = null;
});

describe("NavbarMobileList mega panel accordion", () => {
  it("shows icon, label and description for mega panel children", async () => {
    const scope = mount([MEGA_PANEL_COLUMN]);

    await openColumn(scope, "Risorse");

    expect(scope.textContent).toContain("Formazione");
    expect(scope.textContent).toContain("Scuole e corsi di sceneggiatura.");
    expect(scope.querySelector("[data-navbar-icon]")).not.toBeNull();
    expect(scope.innerHTML).toContain('href="/blog/scuole-di-sceneggiatura"');
    expect(scope.textContent).toContain("Prossimamente");
  });

  it("keeps a legacy column as a plain list of links", async () => {
    const scope = mount([LEGACY_COLUMN]);

    await openColumn(scope, "Risorse");

    expect(scope.textContent).toContain("Blog");
    expect(scope.querySelector("[data-navbar-icon]")).toBeNull();
    expect(scope.innerHTML).toContain('href="/blog"');
  });
});
