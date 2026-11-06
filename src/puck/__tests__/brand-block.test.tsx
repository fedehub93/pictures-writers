import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Brand } from "../blocks/Brand";
import { BRAND_DEFAULT_TYPOGRAPHY } from "../blocks/Brand/defaults";
import { renderBrandBlock } from "../blocks/Brand/render";
import type { BrandBlockUiProps } from "../blocks/Brand/types";

function render(props: Omit<BrandBlockUiProps, "styleVars">) {
  return renderToStaticMarkup(renderBrandBlock(props));
}

describe("Brand block", () => {
  it("renders the site name and logo from Installation settings", () => {
    const html = render({ siteName: "Acme", logoUrl: "/logo.png" });

    expect(html).toContain("Acme");
    expect(html).toContain('src="/logo.png"');
  });

  it("uses custom text and logo when provided", () => {
    const html = render({
      siteName: "Acme",
      logoUrl: "/logo.png",
      customText: "Custom brand",
      customLogoUrl: "/custom-logo.png",
    });

    expect(html).toContain("Custom brand");
    expect(html).not.toContain(">Acme<");
    expect(html).toContain('src="/custom-logo.png"');
    expect(html).not.toContain('src="/logo.png"');
  });

  it("can hide the logo or the site name", () => {
    const withoutLogo = render({
      siteName: "Acme",
      logoUrl: "/logo.png",
      showLogo: false,
    });
    const withoutName = render({
      siteName: "Acme",
      logoUrl: "/logo.png",
      showSiteName: false,
    });

    expect(withoutLogo).not.toContain("<img");
    expect(withoutLogo).toContain("Acme");
    expect(withoutName).toContain("<img");
    expect(withoutName).not.toContain(">Acme<");
  });

  it("renders nothing when neither a logo nor a name is available", () => {
    const html = render({});

    expect(html).not.toContain("<img");
    expect(html).not.toContain("<span");
    expect(html).not.toContain("Pictures Writers");
  });

  it("renders typography and dimension as responsive CSS custom properties", () => {
    const html = render({
      siteName: "Acme",
      typography: {
        desktop: { fontSize: "1.5rem", color: "var(--primary)" },
        tablet: { fontSize: "1.25rem" },
      },
      dimension: {
        desktop: { marginTop: "12px" },
        tablet: { paddingBottom: "8px" },
      },
    });

    expect(html).toContain("puck-dim puck-typo");
    expect(html).toContain("--fs-d:1.5rem");
    expect(html).toContain("--fs-t:1.25rem");
    expect(html).toContain("--tc-d:var(--primary)");
    expect(html).toContain("--mt-d:12px");
    expect(html).toContain("--pb-t:8px");
  });

  it("preserves the current site-name look as the default typography", () => {
    const html = render({ siteName: "Acme" });

    expect(html).toContain("--fs-d:1.125rem");
    expect(html).toContain("--lh-d:1.75rem");
    expect(html).toContain("--fw-d:600");
    expect(html).toContain("--ls-d:0.1em");
    expect(html).toContain('class="uppercase"');
    expect(html).toContain(">Acme</span>");
  });

  it("stores the current site-name look as the block default", () => {
    expect(Brand.defaultProps?.typography).toEqual(BRAND_DEFAULT_TYPOGRAPHY);
  });

  it("exposes dimension and typography fields", () => {
    expect(Brand.fields).toHaveProperty("dimension");
    expect(Brand.fields).toHaveProperty("typography");
  });
});
