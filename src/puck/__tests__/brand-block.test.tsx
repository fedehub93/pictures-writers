import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BrandBlockUi } from "../blocks/Brand/ui/brand";

describe("Brand block", () => {
  it("renders the site name and logo from Installation settings", () => {
    const html = renderToStaticMarkup(
      <BrandBlockUi siteName="Acme" logoUrl="/logo.png" />,
    );

    expect(html).toContain("Acme");
    expect(html).toContain('src="/logo.png"');
  });

  it("uses custom text and logo when provided", () => {
    const html = renderToStaticMarkup(
      <BrandBlockUi
        siteName="Acme"
        logoUrl="/logo.png"
        customText="Custom brand"
        customLogoUrl="/custom-logo.png"
      />,
    );

    expect(html).toContain("Custom brand");
    expect(html).not.toContain(">Acme<");
    expect(html).toContain('src="/custom-logo.png"');
    expect(html).not.toContain('src="/logo.png"');
  });

  it("can hide the logo or the site name", () => {
    const withoutLogo = renderToStaticMarkup(
      <BrandBlockUi siteName="Acme" logoUrl="/logo.png" showLogo={false} />,
    );
    const withoutName = renderToStaticMarkup(
      <BrandBlockUi siteName="Acme" logoUrl="/logo.png" showSiteName={false} />,
    );

    expect(withoutLogo).not.toContain("<img");
    expect(withoutLogo).toContain("Acme");
    expect(withoutName).toContain("<img");
    expect(withoutName).not.toContain(">Acme<");
  });

  it("renders nothing when neither a logo nor a name is available", () => {
    const html = renderToStaticMarkup(<BrandBlockUi />);

    expect(html).not.toContain("<img");
    expect(html).not.toContain("<span");
    expect(html).not.toContain("Pictures Writers");
  });
});
