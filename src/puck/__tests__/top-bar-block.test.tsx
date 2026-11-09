import type { PuckContext, SlotComponent } from "@puckeditor/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TopBar } from "../blocks/TopBar";
import {
  TOP_BAR_DEFAULT_DECORATION,
  TOP_BAR_DEFAULT_DIMENSION,
} from "../blocks/TopBar/defaults";
import { shouldHideTopBar } from "../blocks/TopBar/lib/visibility";
import { renderTopBarBlock } from "../blocks/TopBar/render";
import type {
  TopBarBlockProps,
  TopBarSettings,
} from "../blocks/TopBar/types";

const PUCK: PuckContext = {
  renderDropZone: () => null,
  metadata: {},
  isEditing: false,
  dragRef: null,
};

const ContentSlot: SlotComponent = (props) => (
  <div className={props?.className}>
    <span>Free shipping this week</span>
  </div>
);

const EmptySlot: SlotComponent = (props) => (
  <div className={props?.className} />
);

function render(
  props: {
    content: SlotComponent;
    settings?: TopBarSettings;
    dimension?: TopBarBlockProps["dimension"];
    decoration?: TopBarBlockProps["decoration"];
  },
  puck: PuckContext = PUCK,
) {
  return renderToStaticMarkup(
    renderTopBarBlock({ id: "top-bar", ...props, puck }),
  );
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
    expect(canvasHtml).not.toContain("puck-top-bar-public");
    expect(canvasHtml).toContain("puck-top-bar-slot");
  });

  it("renders dimension and decoration as responsive CSS custom properties", () => {
    const html = render({
      content: ContentSlot,
      dimension: {
        desktop: { width: "100%", paddingTop: "8px", paddingLeft: "16px" },
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

    expect(html).toContain("--w-d:100%");
    expect(html).toContain("--pt-d:8px");
    expect(html).toContain("--pl-d:16px");
    expect(html).toContain("--pb-t:4px");
    expect(html).toContain("--bgc-d:var(--accent)");
    expect(html).toContain("--btw-d:1px");
    expect(html).toContain("--bs-d:solid");
    expect(html).toContain("--bc-d:var(--accent-foreground)");
    expect(html).toContain("--rtl-d:4px");
    expect(html).toContain("--op-d:0.9");
  });

  it("defaults to a neutral full-width strip with padding and no background", () => {
    const html = render({ content: ContentSlot });

    expect(html).toContain("--w-d:100%");
    expect(html).toContain("--pt-d:0.5rem");
    expect(html).toContain("--pr-d:1rem");
    expect(html).toContain("--pb-d:0.5rem");
    expect(html).toContain("--pl-d:1rem");
    expect(html).not.toContain("--bgc-d");
  });

  it("only renders the close button when the bar is dismissible", () => {
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
  });

  it("keeps the bar visible while editing, without a runtime close button", () => {
    const html = render(
      { content: ContentSlot, settings: { dismissible: true } },
      { ...PUCK, isEditing: true },
    );

    expect(html).toContain("Free shipping this week");
    expect(html).not.toContain('aria-label="Dismiss top bar"');
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
    expect(TopBar.defaultProps?.dimension).toEqual(TOP_BAR_DEFAULT_DIMENSION);
    expect(TopBar.defaultProps?.decoration).toEqual(
      TOP_BAR_DEFAULT_DECORATION,
    );
    expect(TopBar.defaultProps?.settings).toEqual({ dismissible: false });
  });

  it("exposes a content slot, settings and only the shared style fields", () => {
    const fields = (TopBar.fields ?? {}) as Record<string, unknown>;

    expect(fields.content).toMatchObject({ type: "slot" });
    expect(fields.settings).toMatchObject({ type: "custom" });
    expect(fields).toHaveProperty("dimension");
    expect(fields).toHaveProperty("decoration");
    expect(fields).not.toHaveProperty("text");
    expect(fields).not.toHaveProperty("link");
    expect(fields).not.toHaveProperty("dismissible");
    expect(fields).not.toHaveProperty("typography");
  });
});
