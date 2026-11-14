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
import { renderCopyrightBlock } from "../blocks/Copyright/render";
import { renderLinkListBlock } from "../blocks/LinkList/render";
import { renderNavbarBlock } from "../blocks/NavbarBlock/render";
import type {
  NavItemUi,
  NavbarBlockRenderContent,
  NavbarColumnChildUi,
} from "../blocks/NavbarBlock/types";
import type { LegacyLinkProps, LinkProps } from "../fields/link/types";
import { editorConfigForRegion } from "../region/editor-config";
import { renderConfigForRegion } from "../region/render-config";
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

function buttonRender() {
  return editorConfigForRegion("HEADER").components.Button
    .render as unknown as RenderEntry;
}

function imageRender() {
  return editorConfigForRegion("HEADER").components.Image
    .render as unknown as RenderEntry;
}

function navbarRender() {
  return editorConfigForRegion("HEADER").components.NavbarBlock
    .render as unknown as RenderEntry;
}

function editorLinkListRender() {
  return editorConfigForRegion("FOOTER").components.LinkList
    .render as unknown as RenderEntry;
}

function editorCopyrightRender() {
  return editorConfigForRegion("FOOTER").components.Copyright
    .render as unknown as RenderEntry;
}

function publishedLinkListRender() {
  return renderConfigForRegion("FOOTER").components.LinkList
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

function mountButton(
  puck: PuckContext,
  link: LinkProps | LegacyLinkProps = LINK,
) {
  return mount(
    buttonRender()({
      ...mergePropsWithDefaults(BLOCK_DEFAULT_PROPS.Button, {
        id: "canvas-button",
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

/**
 * An Image block renders its anchor as the block root when it has a target, so
 * it is the other block that can navigate out of the canvas.
 */
function mountImage(editing: boolean, href = "https://example.com/") {
  return mount(
    imageRender()({
      id: "canvas-image",
      image: { src: "/logo.webp", alt: "Logo", href },
      puck: { ...PUCK, isEditing: editing, dragRef: () => undefined },
    }),
  );
}

const FOOTER_LINKS = {
  content: {
    title: "Risorse",
    links: [
      {
        link: { type: "external" as const, url: "/blog/", label: "Blog" },
      },
      {
        link: {
          type: "external" as const,
          url: "https://example.com/",
          label: "Example",
        },
      },
    ],
  },
};

/**
 * The footer blocks are server-rendered on the published page, so their editor
 * config mounts a separate render variant. This is that entry, through the same
 * config Puck uses for the Footer region.
 */
function mountFooterLinkList(editing: boolean) {
  return mount(
    editorLinkListRender()({
      ...mergePropsWithDefaults(BLOCK_DEFAULT_PROPS.LinkList, {
        id: "canvas-link-list",
        ...FOOTER_LINKS,
      }),
      puck: { ...PUCK, isEditing: editing, dragRef: () => undefined },
    }),
  );
}

const FOOTER_COPYRIGHT = {
  content: {
    showYear: true,
    links: [
      { link: { type: "external" as const, url: "/privacy/", label: "Privacy" } },
    ],
  },
};

function mountFooterCopyright(editing: boolean) {
  return mount(
    editorCopyrightRender()({
      ...mergePropsWithDefaults(BLOCK_DEFAULT_PROPS.Copyright, {
        id: "canvas-copyright",
        ...FOOTER_COPYRIGHT,
      }),
      puck: { ...PUCK, isEditing: editing, dragRef: () => undefined },
    }),
  );
}

/**
 * The public entry is handed `isEditing: true` on purpose: the published
 * footer must not carry the canvas behaviour even when the editor's context
 * reaches it, because it is not the client variant.
 */
function mountPublishedLinkList() {
  return mount(
    publishedLinkListRender()({
      ...FOOTER_LINKS,
      id: "published-link-list",
      puck: { ...PUCK, isEditing: true },
    }),
  );
}

/** The element the server renderer produces, mounted without React handlers. */
function mountStaticMarkup(markup: string) {
  container = document.createElement("div");
  document.body.appendChild(container);
  container.innerHTML = markup;

  return container;
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

describe("Button block in the canvas", () => {
  it("keeps the anchor, its target and its rel while editing", async () => {
    const host = await mountButton(PUCK, { ...LINK, openInNewTab: true });
    const anchor = host.querySelector("a");

    expect(anchor).not.toBeNull();
    expect(anchor!.getAttribute("href")).toBe("https://example.com/");
    expect(anchor!.getAttribute("target")).toBe("_blank");
    expect(anchor!.getAttribute("rel")).toBe("noreferrer");
  });

  it("cancels the click so the anchor never follows it", async () => {
    const host = await mountButton(PUCK);
    const anchor = host.querySelector("a")!;

    expect(click(anchor).defaultPrevented).toBe(true);

    // Pressing Enter on a focused anchor dispatches a click with no pointer
    // detail and no modifier; React's synthetic click is the seam the handler
    // sits on, so the keyboard activation is covered by the same handler.
    expect(click(anchor, { detail: 0 }).defaultPrevented).toBe(true);
  });

  it("cancels a Cmd/Ctrl+click so no tab opens behind the editor", async () => {
    const host = await mountButton(PUCK, { ...LINK, openInNewTab: true });
    const anchor = host.querySelector("a")!;

    expect(click(anchor, { ctrlKey: true }).defaultPrevented).toBe(true);
    expect(click(anchor, { metaKey: true }).defaultPrevented).toBe(true);
  });

  it("cancels a middle click so no tab opens behind the editor", async () => {
    const host = await mountButton(PUCK);

    expect(middleClick(host.querySelector("a")!).defaultPrevented).toBe(true);
  });

  it("cancels the click although Puck stops it at the block root", async () => {
    const host = await mountButton(PUCK);
    const anchor = host.querySelector("a")!;

    // The Button's block root *is* the anchor, so this is exactly where the
    // editor's own click listener sits in the real canvas.
    mimicPuckSelection(anchor);

    expect(click(anchor).defaultPrevented).toBe(true);
  });

  it("still renders a broken link as selectable plain text", async () => {
    const host = await mountButton(PUCK, { label: "Removed page" });
    const text = host.firstElementChild as HTMLElement;

    expect(host.querySelector("a")).toBeNull();
    expect(text.tagName).toBe("SPAN");
    expect(text.textContent).toBe("Removed page");
  });
});

describe("Image block in the canvas", () => {
  it("keeps the anchor as the block root but cancels its click", async () => {
    const host = await mountImage(true);
    const anchor = host.querySelector("a");

    // The markup is the published one: same tag, same target.
    expect(anchor).not.toBeNull();
    expect(anchor!.getAttribute("href")).toBe("https://example.com/");

    expect(click(anchor!).defaultPrevented).toBe(true);
    expect(click(anchor!, { ctrlKey: true }).defaultPrevented).toBe(true);
    expect(middleClick(anchor!).defaultPrevented).toBe(true);
  });

  it("cancels the click although Puck stops it at the block root", async () => {
    const host = await mountImage(true);
    const anchor = host.querySelector("a")!;

    // The linked image's block root *is* the anchor, exactly like the Button.
    mimicPuckSelection(anchor);

    expect(click(anchor).defaultPrevented).toBe(true);
  });

  it("leaves the published image link navigating", async () => {
    const host = await mountImage(false);
    const anchor = host.querySelector("a")!;

    expect(click(anchor).defaultPrevented).toBe(false);
    expect(middleClick(anchor).defaultPrevented).toBe(false);
  });

  it("still renders an image without a target as a div", async () => {
    const host = await mountImage(true, "");

    expect(host.querySelector("a")).toBeNull();
    expect((host.firstElementChild as HTMLElement).tagName).toBe("DIV");
  });

  it("emits the same markup editing and published", () => {
    const props = {
      id: "canvas-image",
      image: { src: "/logo.webp", alt: "Logo", href: "/blog/" },
      puck: { ...PUCK, dragRef: () => undefined },
    };

    const editing = renderToStaticMarkup(
      imageRender()({ ...props, puck: { ...props.puck, isEditing: true } }),
    );
    const published = renderToStaticMarkup(
      imageRender()({ ...props, puck: { ...props.puck, isEditing: false } }),
    );

    expect(editing).toBe(published);
  });
});

describe("Button block on the published path", () => {
  it("leaves the click and the middle click to the browser", async () => {
    const host = await mountButton({ ...PUCK, isEditing: false });
    const anchor = host.querySelector("a")!;

    expect(click(anchor).defaultPrevented).toBe(false);
    expect(click(anchor, { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(middleClick(anchor).defaultPrevented).toBe(false);
  });
});

describe("Link list block in the canvas", () => {
  it("cancels a footer link click instead of navigating", async () => {
    const host = await mountFooterLinkList(true);
    const anchor = anchorByText(host, "Blog");

    expect(anchor, "the footer link did not render").toBeDefined();
    expect(click(anchor!).defaultPrevented).toBe(true);
  });

  it("cancels the click although Puck stops it at the Link list root", async () => {
    const host = await mountFooterLinkList(true);

    // The anchors are children of the block root, which is where Puck attaches
    // its own click listener.
    mimicPuckSelection(host.firstElementChild!);

    const anchor = anchorByText(host, "Blog");

    expect(anchor, "the footer link did not render").toBeDefined();
    expect(click(anchor!).defaultPrevented).toBe(true);
  });
});

describe("Copyright block in the canvas", () => {
  it("cancels a copyright link click instead of navigating", async () => {
    const host = await mountFooterCopyright(true);
    const anchor = anchorByText(host, "Privacy");

    expect(anchor, "the copyright link did not render").toBeDefined();
    expect(click(anchor!).defaultPrevented).toBe(true);
  });

  it("cancels the click although Puck stops it at the Copyright root", async () => {
    const host = await mountFooterCopyright(true);

    // The links are children of the line that is the block root.
    mimicPuckSelection(host.firstElementChild!);

    const anchor = anchorByText(host, "Privacy");

    expect(anchor, "the copyright link did not render").toBeDefined();
    expect(click(anchor!).defaultPrevented).toBe(true);
  });
});

/**
 * As for the Button block: `editing` changes behaviour, never markup. An authored
 * `display: none` is the separate, pre-existing exception handled by the layout
 * classes (the editor keeps a hidden block selectable), so these cases author
 * no layout.
 */
describe("Footer block render parity", () => {
  it("emits byte-identical Link list markup editing and published", () => {
    const editing = renderToStaticMarkup(
      renderLinkListBlock({ ...FOOTER_LINKS, editing: true }),
    );
    const published = renderToStaticMarkup(
      renderLinkListBlock(FOOTER_LINKS),
    );

    expect(editing).toBe(published);
  });

  it("emits byte-identical Copyright markup editing and server-rendered", () => {
    const props = {
      content: FOOTER_COPYRIGHT.content,
      siteName: "Acme",
      year: 2026,
    };

    const editing = renderToStaticMarkup(
      renderCopyrightBlock({ ...props, editing: true }),
    );
    const published = renderToStaticMarkup(renderCopyrightBlock(props));

    expect(editing).toBe(published);
  });
});

describe("Footer blocks on the published path", () => {
  it("leaves a published Link list navigating", async () => {
    const host = await mountPublishedLinkList();
    const anchor = anchorByText(host, "Blog");

    expect(anchor, "the published footer link did not render").toBeDefined();
    expect(click(anchor!).defaultPrevented).toBe(false);
  });

  it("leaves a server-rendered Copyright navigating", () => {
    const host = mountStaticMarkup(
      renderToStaticMarkup(
        renderCopyrightBlock({
          content: FOOTER_COPYRIGHT.content,
          siteName: "Acme",
          year: 2026,
        }),
      ),
    );
    const anchor = anchorByText(host, "Privacy");

    expect(anchor, "the server copyright link did not render").toBeDefined();
    expect(click(anchor!).defaultPrevented).toBe(false);
  });

  it("does not share the editor variant with the public config", () => {
    const footerEditor = editorConfigForRegion("FOOTER").components;
    const footerPublic = renderConfigForRegion("FOOTER").components;

    // The canvas entry and the published entry are never the same function:
    // the editor variant is the only one that passes `editing`.
    expect(footerEditor.LinkList?.render).not.toBe(footerPublic.LinkList?.render);
    expect(footerEditor.Copyright?.render).not.toBe(
      footerPublic.Copyright?.render,
    );
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
