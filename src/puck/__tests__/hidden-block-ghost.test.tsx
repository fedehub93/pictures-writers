// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { PuckContext, SlotComponent } from "@puckeditor/core";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderContainerBlock } from "../blocks/Container/render";
import { renderTextBlock } from "../blocks/Text/render";
import type { LayoutProps } from "../fields/layout";
import type { Responsive } from "../utils/responsive";
import { BREAKPOINTS } from "../utils/breakpoints";

import { declarations, readPuckBaseRules } from "./helpers/css-rules";

/**
 * The hidden-block ghost lives on the block's own root.
 *
 * Every block is `inline` and attaches Puck's drag ref to its root, so the
 * element carrying `puck-hidden-placeholder` is the element Puck tags with
 * `data-puck-component`. Before that tree change the ghost keyed off a wrapper
 * (`[data-puck-component]:has(> .puck-hidden-placeholder)`) and disappeared when
 * the wrapper went away.
 *
 * These tests pin both halves of the contract that cannot drift silently: the
 * class list the editor emits (the pixels are not observable here) and the
 * stylesheet that consumes it.
 */

const rules = readPuckBaseRules();

const GHOST_CLASS = "puck-hidden-placeholder";
const ghostRules = rules.filter((rule) => rule.selector.includes(GHOST_CLASS));

const EDITING_PUCK: PuckContext = {
  renderDropZone: () => null,
  metadata: {},
  isEditing: true,
  dragRef: null,
};

type BreakpointName = keyof typeof BREAKPOINTS;

type HiddenLayout = {
  breakpoint: BreakpointName;
  layout: Responsive<LayoutProps>;
  /** Buckets where the desktop-first cascade resolves to `none`. */
  markers: BreakpointName[];
};

const HIDDEN_LAYOUTS: HiddenLayout[] = [
  {
    breakpoint: "desktop",
    layout: { desktop: { display: "none" } },
    // Desktop-first cascade: the smaller buckets inherit `none` too.
    markers: ["desktop", "tablet", "mobile"],
  },
  {
    breakpoint: "tablet",
    layout: { tablet: { display: "none" } },
    markers: ["tablet", "mobile"],
  },
  {
    breakpoint: "mobile",
    layout: { mobile: { display: "none" } },
    markers: ["mobile"],
  },
];

const BREAKPOINT_QUERIES: Record<BreakpointName, string> = {
  desktop: `@media (min-width: ${BREAKPOINTS.desktop.minWidth}px)`,
  tablet: `@media (min-width: ${BREAKPOINTS.tablet.minWidth}px) and (max-width: ${BREAKPOINTS.tablet.maxWidth}px)`,
  mobile: `@media (max-width: ${BREAKPOINTS.mobile.maxWidth}px)`,
};

/**
 * Stand-in for Puck's slot. The real `Slot` forwards a `ref` to the element it
 * renders, which is what makes a container block's root selectable.
 */
type StubSlotProps = {
  className?: string;
  style?: React.CSSProperties;
  ref?: React.Ref<HTMLDivElement>;
};

const SlotStub: SlotComponent = (slotProps?: StubSlotProps) => {
  const { ref, className, style } = slotProps ?? {};

  return <div ref={ref} data-slot="stub" className={className} style={style} />;
};

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

describe("hidden-block ghost stylesheet", () => {
  it("draws the ghost on the placeholder element, never on a wrapper", () => {
    expect(ghostRules.length).toBeGreaterThan(0);

    for (const rule of ghostRules) {
      // The wrapper selector is the bug this stylesheet used to have.
      expect(rule.selector, rule.selector).not.toContain(":has(");

      // Every ghost rule applies to the node carrying the placeholder class
      // (the `::after` label is the only allowed pseudo-element).
      expect(
        rule.selector.endsWith(`.${GHOST_CLASS}`) ||
          rule.selector.endsWith(`.${GHOST_CLASS}::after`),
        rule.selector,
      ).toBe(true);

      // The class is the editor-only contract: `getLayoutClassNames` emits it
      // only while editing. The rules do not depend on Puck's own canvas
      // attributes, so an upgrade cannot leave a hidden block unselectable.
      expect(rule.selector, rule.selector).not.toContain("[data-puck-");
    }
  });

  it("keeps the base rule neutral until a breakpoint marker matches", () => {
    const baseRules = ghostRules.filter((rule) => rule.media === null);

    expect(baseRules.map((rule) => rule.selector)).toEqual([
      `.${GHOST_CLASS}`,
      `.${GHOST_CLASS}::after`,
    ]);

    const outline = declarations(baseRules[0]);

    // No width, no label, no fade: the marker media queries set them.
    expect(outline.get("outline")?.replace(/\s+/g, " ")).toBe(
      "var(--puck-ghost-outline, 0) dashed var(--puck-color-selection-border, #94a3b8)",
    );
    // No opacity here, so an authored opacity keeps applying at every width
    // where the block is not hidden.
    expect(outline.has("opacity")).toBe(false);
    // A hidden parent is a ghost too, so its properties must not leak into a
    // nested block hidden at a different breakpoint.
    expect(outline.get("--puck-ghost-outline")).toBe("initial");
    expect(outline.get("--puck-hidden-label")).toBe("initial");
    expect(declarations(baseRules[1]).get("content")).toBe(
      "var(--puck-hidden-label, none)",
    );
  });

  it("scopes each ghost variant to exactly one breakpoint", () => {
    for (const { breakpoint, markers } of HIDDEN_LAYOUTS) {
      for (const marker of markers) {
        const markerRules = ghostRules.filter((rule) =>
          rule.selector.includes(`.puck-hidden-at-${marker}`),
        );

        expect(markerRules, `no ghost rule for ${marker}`).toHaveLength(1);
        expect(markerRules[0].media, marker).toBe(
          BREAKPOINT_QUERIES[marker],
        );

        const rule = declarations(markerRules[0]);

        // The authored `display: none` is restored only inside the bucket, so
        // every other width keeps the authored display.
        expect(rule.get("display"), marker).toBe("block !important");
        expect(rule.get("--puck-ghost-outline"), marker).toBe("2px");
        expect(rule.get("--puck-hidden-label"), marker).toBe(
          `"Hidden on ${marker}"`,
        );
        expect(rule.get("opacity"), marker).toBe("0.45");
      }

      // No rule for this marker can live outside its own query.
      expect(
        ghostRules
          .filter((rule) =>
            rule.selector.includes(`.puck-hidden-at-${breakpoint}`),
          )
          .every((rule) => rule.media === BREAKPOINT_QUERIES[breakpoint]),
      ).toBe(true);
    }
  });
});

describe("hidden-block ghost classes", () => {
  it.each(HIDDEN_LAYOUTS)(
    "puts the ghost class on the root Puck selects at $breakpoint",
    async ({ layout, markers }) => {
      const dragRef = vi.fn();
      const host = await mount(
        renderTextBlock({
          id: "ghost-text",
          text: "Hidden label",
          layout,
          puck: { ...EDITING_PUCK, dragRef },
        }),
      );

      const selected = dragRef.mock.calls.at(-1)?.[0] as HTMLElement;

      // The block root, not a wrapper: the host has exactly one child and it
      // is the element Puck receives as its selection/drag node.
      expect(host.children).toHaveLength(1);
      expect(selected).toBe(host.firstElementChild);
      expect(selected.classList.contains("puck-dim")).toBe(true);

      expect(selected.classList.contains(GHOST_CLASS)).toBe(true);

      for (const marker of markers) {
        expect(
          selected.classList.contains(`puck-hidden-at-${marker}`),
          `marker ${marker}`,
        ).toBe(true);
      }

      for (const other of ["desktop", "tablet", "mobile"] as const) {
        if (markers.includes(other)) continue;

        expect(
          selected.classList.contains(`puck-hidden-at-${other}`),
          `unexpected marker ${other}`,
        ).toBe(false);
      }
    },
  );

  it("puts the ghost class on a container block's slot root", async () => {
    const dragRef = vi.fn();
    const host = await mount(
      renderContainerBlock({
        id: "ghost-container",
        items: SlotStub,
        layout: { desktop: { display: "none" } },
        puck: { ...EDITING_PUCK, dragRef },
      }),
    );

    const selected = dragRef.mock.calls.at(-1)?.[0] as HTMLElement;

    expect(host.children).toHaveLength(1);
    expect(selected).toBe(host.firstElementChild);
    expect(selected.dataset.slot).toBe("stub");
    expect(selected.classList.contains("puck-layout")).toBe(true);
    expect(selected.classList.contains(GHOST_CLASS)).toBe(true);
    expect(selected.classList.contains("puck-hidden-at-desktop")).toBe(true);
  });

  it("leaves a block that is not hidden unstyled in the canvas", async () => {
    const dragRef = vi.fn();
    const host = await mount(
      renderTextBlock({
        id: "ghost-visible",
        text: "Visible everywhere",
        layout: { desktop: { display: "flex" } },
        puck: { ...EDITING_PUCK, dragRef },
      }),
    );

    const selected = dragRef.mock.calls.at(-1)?.[0] as HTMLElement;

    expect(selected).toBe(host.firstElementChild);
    expect(selected.className).not.toContain(GHOST_CLASS);
    expect(selected.className).not.toContain("puck-hidden-at-");
  });

  it("never emits the ghost classes on the published path", () => {
    const layout = { mobile: { display: "none" as const } };
    const publicHtml = renderToStaticMarkup(
      renderTextBlock({
        id: "ghost-public",
        text: "Hidden on phones",
        layout,
        puck: { ...EDITING_PUCK, isEditing: false },
      }),
    );

    expect(publicHtml).not.toContain(GHOST_CLASS);
    expect(publicHtml).not.toContain("puck-hidden-at-");
    // The authored rule is still there: only the editor markers are absent.
    expect(publicHtml).toContain("puck-display-m");
  });
});
