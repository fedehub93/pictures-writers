import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Copyright } from "../blocks/Copyright";
import { COPYRIGHT_DEFAULT_TYPOGRAPHY } from "../blocks/Copyright/defaults";
import { renderCopyrightBlock } from "../blocks/Copyright/render";
import type { CopyrightBlockProps } from "../blocks/Copyright/types";

function render(
  props: CopyrightBlockProps & { siteName?: string; year?: number },
) {
  return renderToStaticMarkup(renderCopyrightBlock(props));
}

describe("Copyright block", () => {
  it("renders the copyright line with year and site name", () => {
    const html = render({ siteName: "Acme", year: 2026 });

    expect(html).toContain("©");
    expect(html).toContain("2026");
    expect(html).toContain("Acme");
  });

  it("hides the year when showYear is false", () => {
    const html = render({ siteName: "Acme", year: 2026, showYear: false });

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
      siteName: "Acme",
      year: 2026,
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
    });

    expect(html).toContain("All rights reserved.");
    expect(html).toContain('href="https://example.com/"');
    expect(html).toContain(">Terms</a>");
  });

  it("renders typography and dimension as responsive CSS custom properties", () => {
    const html = render({
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
    const html = render({ siteName: "Acme", year: 2026 });

    expect(html).toContain("--fs-d:0.875rem");
    expect(html).toContain("--lh-d:1.25rem");
  });

  it("stores the small footer type size as the block default", () => {
    expect(Copyright.defaultProps?.typography).toEqual(
      COPYRIGHT_DEFAULT_TYPOGRAPHY,
    );
  });

  it("exposes dimension and typography fields", () => {
    expect(Copyright.fields).toHaveProperty("dimension");
    expect(Copyright.fields).toHaveProperty("typography");
  });
});
