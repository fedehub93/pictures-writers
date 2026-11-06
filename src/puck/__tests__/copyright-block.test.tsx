import type { PuckContext } from "@puckeditor/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Copyright } from "../blocks/Copyright";
import {
  COPYRIGHT_DEFAULT_CONTENT,
  COPYRIGHT_DEFAULT_TYPOGRAPHY,
} from "../blocks/Copyright/defaults";
import { renderCopyrightBlock } from "../blocks/Copyright/render";
import type {
  CopyrightBlockProps,
  CopyrightBlockRenderProps,
} from "../blocks/Copyright/types";

const PUCK: PuckContext = {
  renderDropZone: () => null,
  metadata: {},
  isEditing: false,
  dragRef: null,
};

function render(props: CopyrightBlockRenderProps) {
  return renderToStaticMarkup(renderCopyrightBlock(props));
}

function renderInCanvas(
  props: CopyrightBlockProps,
  metadata: PuckContext["metadata"] = {},
) {
  return renderToStaticMarkup(
    Copyright.render({
      id: "copyright",
      ...props,
      puck: { ...PUCK, metadata },
    }),
  );
}

describe("Copyright block", () => {
  it("renders the copyright line with year and site name", () => {
    const html = render({
      content: { showYear: true },
      siteName: "Acme",
      year: 2026,
    });

    expect(html).toContain("©");
    expect(html).toContain("2026");
    expect(html).toContain("Acme");
  });

  it("hides the year when showYear is false", () => {
    const html = render({
      content: { showYear: false },
      siteName: "Acme",
      year: 2026,
    });

    expect(html).not.toContain("2026");
    expect(html).toContain("Acme");
  });

  it("does not invent a site name when Settings has none", () => {
    const html = render({ year: 2026 });

    expect(html).toContain("©");
    expect(html).toContain("2026");
    expect(html).not.toContain("Pictures Writers");
  });

  it("appends the optional extra text and links", () => {
    const html = render({
      content: {
        extraText: "All rights reserved.",
        links: [
          {
            link: {
              type: "external",
              url: "https://example.com/",
              label: "Terms",
            },
          },
        ],
      },
      siteName: "Acme",
      year: 2026,
    });

    expect(html).toContain("All rights reserved.");
    expect(html).toContain('href="https://example.com/"');
    expect(html).toContain(">Terms</a>");
  });

  it("renders typography and dimension as responsive CSS custom properties", () => {
    const html = render({
      content: { showYear: true },
      siteName: "Acme",
      year: 2026,
      typography: {
        desktop: { fontSize: "1rem", color: "var(--primary)" },
        tablet: { fontSize: "0.875rem" },
      },
      dimension: {
        desktop: { marginTop: "12px" },
        tablet: { paddingBottom: "8px" },
      },
    });

    expect(html).toContain("puck-dim puck-typo");
    expect(html).toContain("--fs-d:1rem");
    expect(html).toContain("--fs-t:0.875rem");
    expect(html).toContain("--tc-d:var(--primary)");
    expect(html).toContain("--mt-d:12px");
    expect(html).toContain("--pb-t:8px");
  });

  it("renders the small footer type size by default", () => {
    const html = render({
      content: { showYear: true },
      siteName: "Acme",
      year: 2026,
    });

    expect(html).toContain("--fs-d:0.875rem");
    expect(html).toContain("--lh-d:1.25rem");
  });

  it("previews the Installation metadata in the editor canvas", () => {
    const html = renderInCanvas(
      { content: { showYear: true } },
      { siteName: "Acme", logoUrl: "/logo.png" },
    );

    expect(html).toContain("Acme");
  });

  it("gives server props precedence over metadata", () => {
    const html = render({
      content: { showYear: true },
      siteName: "Server name",
      metadata: { siteName: "Metadata" },
      year: 2026,
    });

    expect(html).toContain("Server name");
    expect(html).not.toContain("Metadata");
  });

  it("ignores empty metadata values and keeps the block defaults", () => {
    const html = render({
      content: { showYear: true },
      metadata: { siteName: "  " },
      year: 2026,
    });

    expect(html).toContain(">© 2026<");
  });

  it("stores the small footer type size as the block default", () => {
    expect(Copyright.defaultProps?.typography).toEqual(
      COPYRIGHT_DEFAULT_TYPOGRAPHY,
    );
    expect(Copyright.defaultProps?.content).toEqual(
      COPYRIGHT_DEFAULT_CONTENT,
    );
  });

  it("exposes one Copyright content section and only the shared style fields", () => {
    const fields = (Copyright.fields ?? {}) as Record<string, unknown>;

    expect(fields.content).toMatchObject({ type: "custom" });
    expect(fields).toHaveProperty("dimension");
    expect(fields).toHaveProperty("typography");
    expect(fields).not.toHaveProperty("showYear");
    expect(fields).not.toHaveProperty("extraText");
    expect(fields).not.toHaveProperty("links");
  });
});
