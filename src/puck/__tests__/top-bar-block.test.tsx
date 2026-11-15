import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { PuckContext, SlotComponent } from "@puckeditor/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TOP_BAR_DEFAULT_PROPS } from "../blocks/defaults";
import { TopBar } from "../blocks/TopBar";
import {
  TOP_BAR_DEFAULT_DECORATION,
  TOP_BAR_DEFAULT_SIZE,
  TOP_BAR_DEFAULT_SPACING,
} from "../blocks/TopBar/defaults";
import { shouldHideTopBar } from "../blocks/TopBar/lib/visibility";
import type {
  TopBarBlockProps,
  TopBarSettings,
} from "../blocks/TopBar/types";
import { mergePropsWithDefaults } from "../lib/merge-props";
import { editorConfigForRegion } from "../region/editor-config";
import { renderConfigForRegion } from "../region/render-config";

const stylesheet = readFileSync(
  resolve(process.cwd(), "src/puck/styles/puck-base.css"),
  "utf8",
);

const PUCK: PuckContext = {
  renderDropZone: () => null,
  metadata: {},
  isEditing: false,
  dragRef: null,
};

const ContentSlot: SlotComponent = (props) => (
  <div className={props?.className} style={props?.style}>
    <span>Free shipping this week</span>
  </div>
);

const EmptySlot: SlotComponent = (props) => (
  <div className={props?.className} style={props?.style} />
);

type RenderEntry = {
  render: (props: Record<string, unknown>) => React.ReactNode;
};

const editorTopBar = (
  editorConfigForRegion("HEADER").components as unknown as Record<
    string,
    RenderEntry
  >
).TopBar.render;
const publicTopBar = (
  renderConfigForRegion("HEADER").components as unknown as Record<
    string,
    RenderEntry
  >
).TopBar.render;

/**
 * Render the block through both configs and return the public markup.
 *
 * The editor side merges the shared defaults by hand, exactly as the parity
 * test does, because this seam calls the render function instead of mounting
 * the canvas. The two outputs must agree before a test can assert on either.
 */
function render(
  props: {
    content: SlotComponent;
    settings?: TopBarSettings;
    layout?: TopBarBlockProps["layout"];
    size?: TopBarBlockProps["size"];
    spacing?: TopBarBlockProps["spacing"];
    decoration?: TopBarBlockProps["decoration"];
  },
  puck: PuckContext = PUCK,
) {
  const resolved = { id: "top-bar", ...props, puck };
  const editorHtml = renderToStaticMarkup(
    editorTopBar(mergePropsWithDefaults(TOP_BAR_DEFAULT_PROPS, resolved)),
  );
  const publicHtml = renderToStaticMarkup(publicTopBar(resolved));

  expect(publicHtml).toBe(editorHtml);

  return publicHtml;
}

function findTag(html: string, matches: (tag: string) => boolean) {
  return (html.match(/<[a-z][^>]*>/g) ?? []).find(matches);
}

function classesOf(tag: string) {
  return tag.match(/class="([^"]*)"/)?.[1].split(/\s+/) ?? [];
}

/**
 * Return the opening tag of the first element whose class list contains
 * `className`. Matching class tokens avoids `puck-top-bar` also matching
 * `puck-top-bar-slot`.
 */
function tagWithClass(html: string, className: string) {
  const tag = findTag(html, (candidate) =>
    classesOf(candidate).includes(className),
  );

  if (!tag) throw new Error(`No element with class ${className}`);

  return tag;
}

function dismissButtonTag(html: string) {
  return findTag(
    html,
    (tag) =>
      tag.startsWith("<button") &&
      tag.includes('aria-label="Dismiss top bar"'),
  );
}

function expectBreakpointVars(
  tag: string,
  suffix: "d" | "t" | "m",
  expected: Record<string, string>,
) {
  for (const [name, value] of Object.entries(expected)) {
    expect(tag).toContain(`--${name}-${suffix}:${value}`);
  }
}

describe("TopBar block", () => {
  it("renders arbitrary blocks placed in the slot", () => {
    const html = render({ content: ContentSlot });

    expect(html).toContain("Free shipping this week");
    expect(html).toContain("puck-top-bar puck-dim puck-deco");
    expect(html).toContain("puck-top-bar-slot");
  });

  it("hides an empty strip on the public site but keeps the canvas slot editable", () => {
    const publicHtml = render({ content: EmptySlot });
    const canvasHtml = render(
      { content: EmptySlot },
      { ...PUCK, isEditing: true },
    );

    expect(publicHtml).toContain("puck-top-bar-public");
    expect(publicHtml).toContain("puck-top-bar-slot");
    // The public rule keys off `:has(> .puck-top-bar-slot:empty)`, so the slot
    // wrapper must remain an empty, direct child of the strip root.
    expect(stylesheet).toContain(
      ".puck-top-bar-public:has(> .puck-top-bar-slot:empty)",
    );
    expect(publicHtml).toMatch(
      /<div[^>]*class="[^"]*puck-top-bar-public[^"]*"[^>]*><div[^>]*class="[^"]*puck-top-bar-slot[^"]*"[^>]*><\/div>/,
    );
    expect(canvasHtml).not.toContain("puck-top-bar-public");
    expect(canvasHtml).toContain("puck-top-bar-slot");
  });

  it("renders size, spacing and decoration as responsive CSS custom properties on the root", () => {
    const html = render({
      content: ContentSlot,
      size: {
        desktop: { width: "100%" },
      },
      spacing: {
        desktop: { paddingTop: "8px", paddingLeft: "16px" },
        tablet: { paddingBottom: "4px" },
      },
      decoration: {
        desktop: {
          backgroundColor: "var(--accent)",
          borderTopWidth: "1px",
          borderStyle: "solid",
          borderColor: "var(--accent-foreground)",
          borderTopLeftRadius: "4px",
          opacity: "0.9",
        },
      },
    });

    const root = tagWithClass(html, "puck-top-bar");

    expect(root).toContain("--w-d:100%");
    expect(root).toContain("--pt-d:8px");
    expect(root).toContain("--pl-d:16px");
    expect(root).toContain("--pb-t:4px");
    expect(root).toContain("--bgc-d:var(--accent)");
    expect(root).toContain("--btw-d:1px");
    expect(root).toContain("--bs-d:solid");
    expect(root).toContain("--bc-d:var(--accent-foreground)");
    expect(root).toContain("--rtl-d:4px");
    expect(root).toContain("--op-d:0.9");
  });

  it("puts the container layout surface and its variables on the slot", () => {
    const html = render({
      content: ContentSlot,
      layout: {
        desktop: {
          display: "flex",
          flexDirection: "column",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "start",
          alignContent: "space-between",
          justifyItems: "center",
          rowGap: "8px",
          columnGap: "12px",
          gridTemplateColumns: "2fr",
          gridTemplateRows: "1fr",
        },
        tablet: {
          display: "grid",
          flexDirection: "row",
          flexWrap: "nowrap",
          justifyContent: "start",
          alignItems: "end",
          alignContent: "center",
          justifyItems: "end",
          rowGap: "6px",
          columnGap: "10px",
          gridTemplateColumns: "3fr",
          gridTemplateRows: "2fr",
        },
        mobile: {
          display: "grid",
          flexDirection: "row-reverse",
          flexWrap: "wrap-reverse",
          justifyContent: "end",
          alignItems: "stretch",
          alignContent: "space-around",
          justifyItems: "start",
          rowGap: "4px",
          columnGap: "8px",
          gridTemplateColumns: "repeat(2, 1fr)",
          gridTemplateRows: "auto",
        },
      },
    });

    const root = tagWithClass(html, "puck-top-bar");
    const slot = tagWithClass(html, "puck-top-bar-slot");

    // The layout surface moved to the slot: the root keeps only the item-level
    // class, not the container contract.
    expect(classesOf(slot)).toContain("puck-layout");
    expect(classesOf(root)).toContain("puck-layout-item");
    expect(classesOf(root)).not.toContain("puck-layout");

    expectBreakpointVars(slot, "d", {
      disp: "flex",
      fd: "column",
      fwrap: "wrap",
      jc: "center",
      ai: "start",
      ac: "space-between",
      ji: "center",
      rgap: "8px",
      cgap: "12px",
      gtc: "1fr 1fr",
      gtr: "1fr",
    });
    expectBreakpointVars(slot, "t", {
      disp: "grid",
      fd: "row",
      fwrap: "nowrap",
      jc: "start",
      ai: "end",
      ac: "center",
      ji: "end",
      rgap: "6px",
      cgap: "10px",
      gtc: "1fr 1fr 1fr",
      gtr: "1fr 1fr",
    });
    expectBreakpointVars(slot, "m", {
      disp: "grid",
      fd: "row-reverse",
      fwrap: "wrap-reverse",
      jc: "end",
      ai: "stretch",
      ac: "space-around",
      ji: "start",
      rgap: "4px",
      cgap: "8px",
      gtc: "repeat(2, 1fr)",
      gtr: "auto",
    });
  });

  it("keeps align-self and the display rule on the root, not the slot", () => {
    const html = render({
      content: ContentSlot,
      layout: {
        desktop: { display: "flex", justifyContent: "center", alignSelf: "start" },
        tablet: { alignSelf: "center" },
        mobile: { display: "none" },
      },
    });

    const root = tagWithClass(html, "puck-top-bar");
    const slot = tagWithClass(html, "puck-top-bar-slot");

    expect(root).toContain("--as-d:start");
    expect(root).toContain("--as-t:center");
    expect(root).toContain("--disp-d:flex");
    expect(root).toContain("--disp-m:none");
    expect(root).not.toContain("--jc-d");
    expect(slot).not.toContain("--as-d");
    expect(slot).toContain("--jc-d:center");
  });

  it("carries the display rule on both surfaces at every authored breakpoint", () => {
    const html = render({
      content: ContentSlot,
      layout: {
        desktop: { display: "none" },
        tablet: { display: "none" },
        mobile: { display: "none" },
      },
    });

    const root = tagWithClass(html, "puck-top-bar");
    const slot = tagWithClass(html, "puck-top-bar-slot");

    expect(root).toContain("--disp-d:none");
    expect(root).toContain("--disp-t:none");
    expect(root).toContain("--disp-m:none");
    // The strip removes everything, background and padding included, because
    // the display rule sits on the root that carries the decoration.
    expect(root).toContain("puck-top-bar-public");
    expect(slot).toContain("--disp-d:none");
    expect(slot).toContain("--disp-t:none");
    expect(slot).toContain("--disp-m:none");
  });

  it("keeps a bar hidden at the current viewport selectable as a placeholder", () => {
    const canvasHtml = render(
      {
        content: ContentSlot,
        layout: {
          desktop: { display: "flex" },
          tablet: { display: "none" },
          mobile: { display: "none" },
        },
      },
      { ...PUCK, isEditing: true },
    );

    const root = tagWithClass(canvasHtml, "puck-top-bar");
    const slot = tagWithClass(canvasHtml, "puck-top-bar-slot");

    expect(root).toContain("puck-hidden-placeholder");
    expect(root).toContain("puck-hidden-at-tablet");
    expect(root).toContain("puck-hidden-at-mobile");
    expect(root).toContain("--disp-t:none");
    expect(root).toContain("--disp-m:none");
    // The local display reset is gone in the canvas, so the slot falls back to
    // the nearest visible breakpoint instead of hiding the placeholder content.
    expect(slot).not.toContain("--disp-t:none");
    expect(slot).not.toContain("--disp-m:none");
    expect(slot).toContain("--disp-d:flex");
    expect(canvasHtml).toContain("Free shipping this week");
  });

  it("defaults to a neutral full-width row without hardcoded vertical centring", () => {
    const html = render({ content: ContentSlot });

    const root = tagWithClass(html, "puck-top-bar");
    const slot = tagWithClass(html, "puck-top-bar-slot");

    expect(root).toContain("--w-d:100%");
    expect(root).toContain("--pt-d:0.5rem");
    expect(root).toContain("--pr-d:1rem");
    expect(root).toContain("--pb-d:0.5rem");
    expect(root).toContain("--pl-d:1rem");
    expect(root).not.toContain("--bgc-d");
    expect(root).not.toContain("items-center");
    expect(slot).toContain("puck-layout");
    expect(slot).toContain("--disp-d:flex");
    expect(slot).toContain("--ai-d:center");
  });

  it("keeps an authored size from bringing the default padding back", () => {
    // A document migrated from the single `dimension` prop carries an empty
    // `spacing` object when it never authored padding. The empty object is what
    // suppresses `TOP_BAR_DEFAULT_SPACING`, so the strip keeps the look it had
    // before the split instead of gaining a padding it never had.
    const html = render({
      content: ContentSlot,
      size: { desktop: { height: "3rem" } },
      spacing: {},
    });

    const root = tagWithClass(html, "puck-top-bar");

    expect(root).toContain("--h-d:3rem");
    expect(root).not.toContain("--w-d");
    expect(root).not.toContain("--pt-d");
    expect(root).not.toContain("--pb-d");
    expect(root).not.toContain("--pl-d");
    expect(root).not.toContain("--pr-d");
  });

  it("keeps the default width off a padding-only authored box", () => {
    // The mirror case: a legacy box that authored only padding reaches the new
    // shape as `size: {}`, which suppresses `TOP_BAR_DEFAULT_SIZE`. The class
    // keeps the strip full width; the variable must not come back.
    const html = render({
      content: ContentSlot,
      size: {},
      spacing: { desktop: { paddingTop: "8px" } },
    });

    const root = tagWithClass(html, "puck-top-bar");

    expect(root).toContain("--pt-d:8px");
    expect(root).not.toContain("--w-d");
  });

  it("keeps a row when a document omits display from its layout", () => {
    const html = render({
      content: ContentSlot,
      layout: { desktop: { justifyContent: "start" } },
    });

    const root = tagWithClass(html, "puck-top-bar");
    const slot = tagWithClass(html, "puck-top-bar-slot");

    // `.puck-layout` resets the display variables locally, so both surfaces
    // need an explicit fallback instead of resolving to an inline box.
    expect(root).toContain("--disp-d:flex");
    expect(slot).toContain("--disp-d:flex");
    expect(slot).toContain("--jc-d:start");
  });

  it("pins the close button out of the layout flow and reserves trailing space", () => {
    const html = render({
      content: ContentSlot,
      settings: { dismissible: true },
    });

    const button = dismissButtonTag(html);
    const slot = tagWithClass(html, "puck-top-bar-slot");

    expect(button).toBeDefined();
    expect(button).toContain("absolute");
    expect(button).toContain("end-1");
    expect(button).toContain("top-1/2");
    expect(button).toContain("-translate-y-1/2");
    expect(button).not.toContain("ml-2");
    expect(slot).toContain("pe-8");
  });

  it("renders the close button and its trailing space only when dismissible", () => {
    const dismissible = render({
      content: ContentSlot,
      settings: { dismissible: true },
    });
    const persistent = render({
      content: ContentSlot,
      settings: { dismissible: false },
    });

    expect(dismissible).toContain('aria-label="Dismiss top bar"');
    expect(persistent).not.toContain('aria-label="Dismiss top bar"');
    expect(tagWithClass(persistent, "puck-top-bar-slot")).not.toContain(
      "pe-8",
    );
  });

  it("keeps the bar visible while editing, without a runtime close button", () => {
    const html = render(
      { content: ContentSlot, settings: { dismissible: true } },
      { ...PUCK, isEditing: true },
    );

    expect(html).toContain("Free shipping this week");
    expect(html).not.toContain('aria-label="Dismiss top bar"');
    // The canvas still reserves the button's trailing space: the slot classes
    // must not change between authoring and publishing.
    expect(tagWithClass(html, "puck-top-bar-slot")).toContain("pe-8");
  });

  it("hides a dismissed dismissible bar for returning visitors", () => {
    expect(
      shouldHideTopBar({
        dismissible: true,
        dismissed: true,
        editMode: false,
      }),
    ).toBe(true);
  });

  it("keeps a dismissed bar visible while editing and ignores dismissal when off", () => {
    expect(
      shouldHideTopBar({
        dismissible: true,
        dismissed: true,
        editMode: true,
      }),
    ).toBe(false);
    expect(
      shouldHideTopBar({
        dismissible: false,
        dismissed: true,
        editMode: false,
      }),
    ).toBe(false);
  });

  it("stores the neutral default as the block defaults", () => {
    expect(TopBar.defaultProps?.size).toEqual(TOP_BAR_DEFAULT_SIZE);
    expect(TopBar.defaultProps?.spacing).toEqual(TOP_BAR_DEFAULT_SPACING);
    expect(TopBar.defaultProps?.decoration).toEqual(
      TOP_BAR_DEFAULT_DECORATION,
    );
    expect(TopBar.defaultProps?.settings).toEqual({ dismissible: false });
  });

  it("exposes a content slot, settings and only the shared style fields", () => {
    const fields = (TopBar.fields ?? {}) as Record<string, unknown>;

    expect(fields.content).toMatchObject({ type: "slot" });
    expect(fields.settings).toMatchObject({ type: "custom" });
    expect(fields).toHaveProperty("size");
    expect(fields).toHaveProperty("spacing");
    expect(fields).toHaveProperty("decoration");
    expect(fields).not.toHaveProperty("text");
    expect(fields).not.toHaveProperty("link");
    expect(fields).not.toHaveProperty("dismissible");
    expect(fields).not.toHaveProperty("typography");
  });
});
