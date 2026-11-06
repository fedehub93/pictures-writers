import type { PuckContext } from "@puckeditor/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AnnouncementBar } from "../blocks/AnnouncementBar";
import {
  ANNOUNCEMENT_DEFAULT_DECORATION,
  ANNOUNCEMENT_DEFAULT_DIMENSION,
  ANNOUNCEMENT_DEFAULT_TYPOGRAPHY,
} from "../blocks/AnnouncementBar/defaults";
import { renderAnnouncementBarBlock } from "../blocks/AnnouncementBar/render";
import type { AnnouncementBarBlockProps } from "../blocks/AnnouncementBar/types";
import { AnnouncementBarBlockUi } from "../blocks/AnnouncementBar/ui/announcement-bar";

const PUCK: PuckContext = {
  renderDropZone: () => null,
  metadata: {},
  isEditing: false,
  dragRef: null,
};

function render(
  props: AnnouncementBarBlockProps & { id?: string },
  puck: PuckContext = PUCK,
) {
  return renderToStaticMarkup(
    renderAnnouncementBarBlock({ id: "announcement", ...props, puck }),
  );
}

describe("AnnouncementBar block", () => {
  it("renders a thin banner with the configured text", () => {
    const html = render({ text: "Free shipping this week" });

    expect(html).toContain("Free shipping this week");
    expect(html).toContain("puck-dim puck-typo puck-deco");
  });

  it("renders decoration and typography as responsive CSS custom properties", () => {
    const html = render({
      text: "Sale",
      decoration: {
        desktop: {
          backgroundColor: "var(--accent)",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "var(--accent-foreground)",
          borderTopLeftRadius: "4px",
          opacity: "0.9",
        },
      },
      typography: {
        desktop: { color: "var(--accent-foreground)", fontSize: "14px" },
        tablet: { lineHeight: "1.5", textAlign: "left" },
      },
    });

    expect(html).toContain("--bgc-d:var(--accent)");
    expect(html).toContain("--bw-d:1px");
    expect(html).toContain("--bs-d:solid");
    expect(html).toContain("--bc-d:var(--accent-foreground)");
    expect(html).toContain("--rtl-d:4px");
    expect(html).toContain("--op-d:0.9");
    expect(html).toContain("--tc-d:var(--accent-foreground)");
    expect(html).toContain("--fs-d:14px");
    expect(html).toContain("--lh-t:1.5");
    expect(html).toContain("--ta-t:left");
  });

  it("renders dimension as responsive CSS custom properties", () => {
    const html = render({
      text: "Spaced",
      dimension: {
        desktop: { width: "100%", minHeight: "3rem" },
        tablet: { paddingBottom: "8px" },
      },
    });

    expect(html).toContain("--w-d:100%");
    expect(html).toContain("--mh-d:3rem");
    expect(html).toContain("--pb-t:8px");
  });

  it("falls back to the primary palette and small centred type", () => {
    const html = render({ text: "Sale" });

    expect(html).toContain("--bgc-d:var(--primary)");
    expect(html).toContain("--tc-d:var(--primary-foreground)");
    expect(html).toContain("--fs-d:0.75rem");
    expect(html).toContain("--lh-d:1.25");
    expect(html).toContain("--ta-d:center");
    expect(html).toContain("--w-d:100%");
    expect(html).toContain("--mh-d:2rem");
    expect(html).toContain("--pt-d:0.375rem");
    expect(html).toContain("--pl-d:2.5rem");
  });

  it("wraps the message in a link when the target is resolved", () => {
    const html = render({
      text: "Read the news",
      link: {
        type: "external",
        url: "https://example.com/news",
        openInNewTab: true,
        label: "Read the news",
      },
    });

    expect(html).toContain('href="https://example.com/news"');
    expect(html).toContain('target="_blank"');
  });

  it("renders the resolved { label, href } shape produced by the server", () => {
    const html = renderToStaticMarkup(
      <AnnouncementBarBlockUi
        text="Read the news"
        link={{
          label: "Read the news",
          href: "https://example.com/news",
          openInNewTab: true,
        }}
      />,
    );

    expect(html).toContain('href="https://example.com/news"');
    expect(html).toContain('target="_blank"');
  });

  it("renders plain text when an entity link could not be resolved", () => {
    const html = render({
      text: "Draft page",
      link: { type: "page", pageId: "missing" },
    });

    expect(html).toContain("Draft page");
    expect(html).not.toContain("<a ");
  });

  it("only renders the close button when the banner is dismissible", () => {
    const closable = render({ id: "bar", text: "Sale", dismissible: true });
    const persistent = render({ id: "bar", text: "Sale" });

    expect(closable).toContain('aria-label="Dismiss announcement"');
    expect(persistent).not.toContain('aria-label="Dismiss announcement"');
  });

  it("keeps the banner visible while editing, without a runtime close button", () => {
    const html = render(
      { id: "bar", text: "Sale", dismissible: true },
      { ...PUCK, isEditing: true },
    );

    expect(html).toContain("Sale");
    expect(html).not.toContain('aria-label="Dismiss announcement"');
  });

  it("renders nothing when the text is empty", () => {
    const html = render({ text: "   " });

    expect(html).toBe("");
  });

  it("stores the previous look as the block defaults", () => {
    expect(AnnouncementBar.defaultProps?.decoration).toEqual(
      ANNOUNCEMENT_DEFAULT_DECORATION,
    );
    expect(AnnouncementBar.defaultProps?.typography).toEqual(
      ANNOUNCEMENT_DEFAULT_TYPOGRAPHY,
    );
    expect(AnnouncementBar.defaultProps?.dimension).toEqual(
      ANNOUNCEMENT_DEFAULT_DIMENSION,
    );
  });

  it("exposes dimension, typography and decoration instead of colour props", () => {
    const fields = AnnouncementBar.fields ?? {};

    expect(fields).toHaveProperty("dimension");
    expect(fields).toHaveProperty("typography");
    expect(fields).toHaveProperty("decoration");
    expect(fields).not.toHaveProperty("backgroundColor");
    expect(fields).not.toHaveProperty("textColor");
  });
});
