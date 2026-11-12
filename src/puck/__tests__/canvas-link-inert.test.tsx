// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { PuckContext } from "@puckeditor/core";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/blog/",
}));

/**
 * `next/link` is replaced by a plain anchor so these tests read the block's
 * click contract, not Next's navigation. The contract is the one Next relies
 * on: our handler cancels the event, and `linkClicked` in
 * `next/dist/client/app-dir/link.js` returns as soon as `event.defaultPrevented`
 * is set, before it touches the router.
 */
vi.mock("next/link", () => ({
  default: (props: React.ComponentProps<"a">) => <a {...props} />,
}));

import { BLOCK_DEFAULT_PROPS } from "../blocks/defaults";
import { renderNavbarBlock } from "../blocks/NavbarBlock/render";
import type {
  NavItemUi,
  NavbarBlockRenderContent,
  NavbarColumnChildUi,
} from "../blocks/NavbarBlock/types";
import type { LegacyLinkProps, LinkProps } from "../fields/link/types";
import { editorConfigForRegion } from "../region/editor-config";
import { mergePropsWithDefaults } from "../lib/merge-props";

/**
 * While the canvas is open a block link must select the block instead of
 * navigating. The anchor stays an anchor — the render-pipeline parity test
 * requires the canvas and the published page to emit the same markup — so the
 * behaviour to observe is the event the anchor acts on: a click that reaches
 * the browser is followed, a cancelled one is not.
 *
 * These tests mount the block in a DOM through the same editor config Puck
 * uses, because a server-markup snapshot cannot observe a handler.
 */

const PUCK: PuckContext = {
  renderDropZone: () => null,
  metadata: {},
  isEditing: true,
  dragRef: null,
};

const LINK = {
  type: "external",
  url: "https://example.com/",
  label: "Example",
} as const;

const COLUMN_CHILDREN: NavbarColumnChildUi[] = [
  {
    label: "Formazione",
    description: "Scuole e corsi di sceneggiatura.",
    icon: { name: "school" },
    link: { label: "Formazione", href: "/blog/formazione/" },
  },
];

const COLUMN: Extract<NavItemUi, { type: "column" }> = {
  type: "column",
  label: "Risorse",
  items: COLUMN_CHILDREN,
};

/**
 * One of each NavbarBlock entry type, so the block mount covers the top-level
 * link, the call to action, the mega-panel card and the column child.
 */
const NAV_ITEMS: NavItemUi[] = [
  { type: "link", label: "Blog", link: { label: "Blog", href: "/blog/" } },
  COLUMN,
  {
    type: "card",
    label: "Workbook",
    description: "Una guida pratica alla sceneggiatura.",
    link: { label: "Workbook", href: "/shop/workbook/" },
  },
  {
    type: "cta",
    label: "Contatti",
    link: { label: "Contatti", href: "/contatti/" },
    variant: "primary",
  },
];

const NAV_CONTENT: NavbarBlockRenderContent = {
  items: NAV_ITEMS,
  layout: "mega",
  collapseAt: "tablet",
};

type RenderEntry = (props: Record<string, unknown>) => React.ReactNode;

function linkRender() {
  return editorConfigForRegion("HEADER").components.Link
    .render as unknown as RenderEntry;
}

function navbarRender() {
  return editorConfigForRegion("HEADER").components.NavbarBlock
    .render as unknown as RenderEntry;
}

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  document.body.innerHTML = "";
  root = null;
  container = null;
});

async function mount(node: React.ReactNode) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  await act(async () => {
    root!.render(node);
  });

  return container;
}

/**
 * Puck's canvas attaches a native `click` listener to the block root and calls
 * `stopPropagation()` there (see `DraggableComponent` in `@puckeditor/core`),
 * so the click never bubbles to the React root container where a normal
 * `onClick` would run. This helper reproduces that listener on the element the
 * block hands to Puck's `dragRef`, which is what the editor does on mount.
 */
function mimicPuckSelection(blockRoot: Element) {
  blockRoot.addEventListener("click", (event) => {
    event.stopPropagation();
  });
}

/**
 * Dispatch a click the way a browser does and report whether the default was
 * cancelled. Cancelling it is what stops the navigation: the browser would
 * follow the anchor, and `next/link` bails before it touches the router.
 */
function click(element: Element, init: MouseEventInit = {}) {
  const event = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    ...init,
  });

  act(() => {
    element.dispatchEvent(event);
  });

  return event;
}

/** A middle click activates a link through `auxclick`, not `click`. */
function middleClick(element: Element) {
  const event = new MouseEvent("auxclick", {
    bubbles: true,
    cancelable: true,
    button: 1,
  });

  act(() => {
    element.dispatchEvent(event);
  });

  return event;
}

function anchorByText(scope: ParentNode, text: string) {
  return Array.from(scope.querySelectorAll("a")).find(
    (anchor) => anchor.textContent?.trim() === text,
  );
}

function anchorByHref(scope: ParentNode, href: string) {
  return scope.querySelector<HTMLAnchorElement>(`a[href="${href}"]`);
}

function mountLink(
  puck: PuckContext,
  link: LinkProps | LegacyLinkProps = LINK,
) {
  return mount(
    linkRender()({
      ...mergePropsWithDefaults(BLOCK_DEFAULT_PROPS.Link, {
        id: "canvas-link",
        link,
      }),
      puck,
    }),
  );
}

function mountNavbar(editing: boolean) {
  return mount(
    navbarRender()({
      ...mergePropsWithDefaults(BLOCK_DEFAULT_PROPS.NavbarBlock, {
        id: "canvas-navbar",
        content: NAV_CONTENT,
      }),
      puck: { ...PUCK, isEditing: editing, dragRef: () => undefined },
    }),
  );
}

async function openMobileSheet() {
  const trigger = container?.querySelector<HTMLButtonElement>(
    'button[aria-label="Open menu"]',
  );

  expect(trigger, "the mobile trigger is missing").not.toBeNull();

  await act(async () => {
    trigger!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  const sheet = document.querySelector<HTMLElement>(
    '[data-slot="sheet-content"]',
  );

  expect(sheet, "the mobile sheet did not open").not.toBeNull();

  return sheet!;
}

describe("Link block in the canvas", () => {
  it("keeps the anchor, its target and its rel while editing", async () => {
    const host = await mountLink(PUCK, { ...LINK, openInNewTab: true });
    const anchor = host.querySelector("a");

    expect(anchor).not.toBeNull();
    expect(anchor!.getAttribute("href")).toBe("https://example.com/");
    expect(anchor!.getAttribute("target")).toBe("_blank");
    expect(anchor!.getAttribute("rel")).toBe("noreferrer");
  });

  it("cancels the click so the anchor never follows it", async () => {
    const host = await mountLink(PUCK);
    const anchor = host.querySelector("a")!;

    expect(click(anchor).defaultPrevented).toBe(true);

    // Pressing Enter on a focused anchor dispatches a click with no pointer
    // detail and no modifier; React's synthetic click is the seam the handler
    // sits on, so the keyboard activation is covered by the same handler.
    expect(click(anchor, { detail: 0 }).defaultPrevented).toBe(true);
  });

  it("cancels a Cmd/Ctrl+click so no tab opens behind the editor", async () => {
    const host = await mountLink(PUCK, { ...LINK, openInNewTab: true });
    const anchor = host.querySelector("a")!;

    expect(click(anchor, { ctrlKey: true }).defaultPrevented).toBe(true);
    expect(click(anchor, { metaKey: true }).defaultPrevented).toBe(true);
  });

  it("cancels a middle click so no tab opens behind the editor", async () => {
    const host = await mountLink(PUCK);

    expect(middleClick(host.querySelector("a")!).defaultPrevented).toBe(true);
  });

  it("cancels the click although Puck stops it at the block root", async () => {
    const host = await mountLink(PUCK);
    const anchor = host.querySelector("a")!;

    // The Link's block root *is* the anchor, so this is exactly where the
    // editor's own click listener sits in the real canvas.
    mimicPuckSelection(anchor);

    expect(click(anchor).defaultPrevented).toBe(true);
  });

  it("still renders a broken link as selectable plain text", async () => {
    const host = await mountLink(PUCK, { label: "Removed page" });
    const text = host.firstElementChild as HTMLElement;

    expect(host.querySelector("a")).toBeNull();
    expect(text.tagName).toBe("SPAN");
    expect(text.textContent).toBe("Removed page");
  });
});

describe("Link block on the published path", () => {
  it("leaves the click and the middle click to the browser", async () => {
    const host = await mountLink({ ...PUCK, isEditing: false });
    const anchor = host.querySelector("a")!;

    expect(click(anchor).defaultPrevented).toBe(false);
    expect(click(anchor, { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(middleClick(anchor).defaultPrevented).toBe(false);
  });
});

describe("NavbarBlock in the canvas", () => {
  it("cancels the desktop link and the CTA", async () => {
    const host = await mountNavbar(true);

    for (const label of ["Blog", "Contatti"]) {
      const anchor = anchorByText(host, label);

      expect(anchor, `no desktop anchor for ${label}`).toBeDefined();
      expect(
        click(anchor!).defaultPrevented,
        `${label} navigated in the canvas`,
      ).toBe(true);
    }
  });

  it("cancels the mega-panel card and the column child", async () => {
    const host = await mountNavbar(true);

    // A closed panel is not mounted, so each trigger is clicked to open its
    // panel the way a pointer does; the entry is asserted while it is open.
    for (const [triggerLabel, href, name] of [
      ["Workbook", "/shop/workbook/", "card"],
      ["Risorse", "/blog/formazione/", "column child"],
    ] as const) {
      const trigger = Array.from(host.querySelectorAll("button")).find(
        (button) => button.textContent?.includes(triggerLabel),
      );

      expect(trigger, `no trigger for ${triggerLabel}`).toBeDefined();

      await act(async () => {
        trigger!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });

      const anchor = anchorByHref(host, href);

      expect(anchor, `the ${name} did not mount`).not.toBeNull();
      expect(
        click(anchor!).defaultPrevented,
        `the ${name} navigated in the canvas`,
      ).toBe(true);
    }
  });

  it("cancels a navbar entry although Puck stops the click at the navbar root", async () => {
    const host = await mountNavbar(true);

    // The navigation root is the block root for every entry, so the editor's
    // listener sits between the anchor and the React root container.
    mimicPuckSelection(host.firstElementChild!);

    const anchor = anchorByText(host, "Blog");

    expect(anchor, "no desktop anchor for Blog").toBeDefined();
    expect(click(anchor!).defaultPrevented).toBe(true);
  });

  it("cancels the mobile sheet rows and the CTA", async () => {
    await mountNavbar(true);
    const sheet = await openMobileSheet();

    for (const [label, href] of [
      ["Blog", "/blog/"],
      ["Contatti", "/contatti/"],
      ["Workbook", "/shop/workbook/"],
    ] as const) {
      const anchor = anchorByHref(sheet, href);

      expect(anchor, `no sheet row for ${label}`).not.toBeNull();
      expect(
        click(anchor!).defaultPrevented,
        `${label} navigated in the canvas`,
      ).toBe(true);
    }
  });

  it("cancels the mobile accordion children", async () => {
    await mountNavbar(true);
    const sheet = await openMobileSheet();
    const trigger = Array.from(sheet.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Risorse"),
    );

    expect(trigger, "no accordion trigger for Risorse").toBeDefined();

    await act(async () => {
      trigger!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const child = anchorByHref(sheet, "/blog/formazione/");

    expect(child, "the accordion child did not mount").not.toBeNull();
    expect(click(child!).defaultPrevented).toBe(true);
  });

  it("leaves the published navbar and its panels navigating", async () => {
    const host = await mount(
      renderNavbarBlock({
        content: NAV_CONTENT,
        editing: false,
      }),
    );

    const anchor = anchorByText(host, "Blog");

    expect(anchor, "the published navbar lost its link").toBeDefined();
    expect(click(anchor!).defaultPrevented).toBe(false);

    const trigger = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Workbook"),
    );

    expect(trigger, "no trigger for the published card").toBeDefined();

    await act(async () => {
      trigger!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const card = anchorByHref(host, "/shop/workbook/");

    expect(card, "the published panel lost its card").not.toBeNull();
    expect(click(card!).defaultPrevented).toBe(false);
  });
});

describe("NavbarBlock render parity", () => {
  it("emits byte-identical markup editing, published and server-rendered", () => {
    const editing = renderToStaticMarkup(
      renderNavbarBlock({ content: NAV_CONTENT, editing: true }),
    );
    const published = renderToStaticMarkup(
      renderNavbarBlock({ content: NAV_CONTENT, editing: false }),
    );

    // The public server renderer omits the flag entirely; it must be the same
    // tree as the canvas, so the three paths cannot drift.
    const server = renderToStaticMarkup(
      renderNavbarBlock({ content: NAV_CONTENT }),
    );

    expect(editing).toBe(published);
    expect(server).toBe(published);
  });
});
