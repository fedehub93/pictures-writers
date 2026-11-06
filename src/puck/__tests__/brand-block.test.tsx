import type { PuckContext } from "@puckeditor/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Brand } from "../blocks/Brand";
import {
  BRAND_DEFAULT_CONTENT,
  BRAND_DEFAULT_TYPOGRAPHY,
} from "../blocks/Brand/defaults";
import { renderBrandBlock } from "../blocks/Brand/render";
import type { BrandBlockRenderProps } from "../blocks/Brand/types";

const PUCK: PuckContext = {
  renderDropZone: () => null,
  metadata: {},
  isEditing: false,
  dragRef: null,
};

function render(props: BrandBlockRenderProps) {
  return renderToStaticMarkup(renderBrandBlock(props));
}

function renderInCanvas(
  content: BrandBlockRenderProps["content"],
  metadata: PuckContext["metadata"] = {},
) {
  return renderToStaticMarkup(
    Brand.render({
      id: "brand",
      content,
      puck: { ...PUCK, metadata },
    }),
  );
}

describe("Brand block", () => {
  it("renders the site name and logo from Installation settings", () => {
    const html = render({
      content: { showLogo: true, showSiteName: true },
      siteName: "Acme",
      logoUrl: "/logo.png",
    });

    expect(html).toContain("Acme");
    expect(html).toContain('src="/logo.png"');
  });

  it("uses custom text and logo when provided", () => {
    const html = render({
      content: {
        showLogo: true,
        showSiteName: true,
        customText: "Custom brand",
        customLogoUrl: "/custom-logo.png",
      },
      siteName: "Acme",
      logoUrl: "/logo.png",
      metadata: { siteName: "Metadata", logoUrl: "/metadata-logo.png" },
    });

    expect(html).toContain("Custom brand");
    expect(html).not.toContain(">Acme<");
    expect(html).toContain('src="/custom-logo.png"');
    expect(html).not.toContain('src="/logo.png"');
    expect(html).not.toContain('src="/metadata-logo.png"');
  });

  it("can hide the logo or the site name", () => {
    const withoutLogo = render({
      content: { showLogo: false, showSiteName: true },
      siteName: "Acme",
      logoUrl: "/logo.png",
    });
    const withoutName = render({
      content: { showLogo: true, showSiteName: false },
      siteName: "Acme",
      logoUrl: "/logo.png",
    });

    expect(withoutLogo).not.toContain("<img");
    expect(withoutLogo).toContain("Acme");
    expect(withoutName).toContain("<img");
    expect(withoutName).not.toContain(">Acme<");
  });

  it("renders nothing when neither a logo nor a name is available", () => {
    const html = render({ content: { showLogo: true, showSiteName: true } });

    expect(html).not.toContain("<img");
    expect(html).not.toContain("<span");
    expect(html).not.toContain("Pictures Writers");
  });

  it("previews the Installation metadata in the editor canvas", () => {
    const html = renderInCanvas(
      { showLogo: true, showSiteName: true },
      { siteName: "Acme", logoUrl: "/logo.png" },
    );

    expect(html).toContain(">Acme</span>");
    expect(html).toContain('src="/logo.png"');
  });

  it("makes the logo and site-name toggles visible in the canvas", () => {
    const withoutLogo = renderInCanvas(
      { showLogo: false, showSiteName: true },
      { siteName: "Acme", logoUrl: "/logo.png" },
    );
    const withoutName = renderInCanvas(
      { showLogo: true, showSiteName: false },
      { siteName: "Acme", logoUrl: "/logo.png" },
    );

    expect(withoutLogo).not.toContain("<img");
    expect(withoutLogo).toContain(">Acme</span>");
    expect(withoutName).toContain("<img");
    expect(withoutName).not.toContain(">Acme</span>");
  });

  it("gives server props precedence over metadata", () => {
    const html = render({
      content: { showLogo: true, showSiteName: true },
      siteName: "Server name",
      logoUrl: "/server-logo.png",
      metadata: { siteName: "Metadata", logoUrl: "/metadata-logo.png" },
    });

    expect(html).toContain("Server name");
    expect(html).toContain('src="/server-logo.png"');
    expect(html).not.toContain("Metadata");
    expect(html).not.toContain('src="/metadata-logo.png"');
  });

  it("ignores empty metadata values and keeps the block defaults", () => {
    const html = renderInCanvas(
      { showLogo: true, showSiteName: true },
      { siteName: "  ", logoUrl: "" },
    );

    expect(html).toBe("");
  });

  it("renders typography and dimension as responsive CSS custom properties", () => {
    const html = render({
      content: { showLogo: true, showSiteName: true },
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
    const html = render({
      content: { showLogo: true, showSiteName: true },
      siteName: "Acme",
    });

    expect(html).toContain("--fs-d:1.125rem");
    expect(html).toContain("--lh-d:1.75rem");
    expect(html).toContain("--fw-d:600");
    expect(html).toContain("--ls-d:0.1em");
    expect(html).toContain('class="uppercase"');
    expect(html).toContain(">Acme</span>");
  });

  it("stores the current look as the block defaults", () => {
    expect(Brand.defaultProps?.content).toEqual(BRAND_DEFAULT_CONTENT);
    expect(Brand.defaultProps?.typography).toEqual(BRAND_DEFAULT_TYPOGRAPHY);
  });

  it("exposes one Brand content section and only the shared style fields", () => {
    const fields = (Brand.fields ?? {}) as Record<string, unknown>;

    expect(fields.content).toMatchObject({ type: "custom" });
    expect(fields).toHaveProperty("dimension");
    expect(fields).toHaveProperty("typography");
    expect(fields).not.toHaveProperty("showLogo");
    expect(fields).not.toHaveProperty("showSiteName");
    expect(fields).not.toHaveProperty("customText");
    expect(fields).not.toHaveProperty("customLogoUrl");
  });
});
