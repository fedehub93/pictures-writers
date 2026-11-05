import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CopyrightBlockUi } from "../blocks/Copyright/ui/copyright";

describe("Copyright block", () => {
  it("renders the copyright line with year and site name", () => {
    const html = renderToStaticMarkup(
      <CopyrightBlockUi siteName="Acme" year={2026} />,
    );

    expect(html).toContain("©");
    expect(html).toContain("2026");
    expect(html).toContain("Acme");
  });

  it("hides the year when showYear is false", () => {
    const html = renderToStaticMarkup(
      <CopyrightBlockUi siteName="Acme" year={2026} showYear={false} />,
    );

    expect(html).not.toContain("2026");
    expect(html).toContain("Acme");
  });

  it("does not invent a site name when Settings has none", () => {
    const html = renderToStaticMarkup(<CopyrightBlockUi year={2026} />);

    expect(html).toContain("©");
    expect(html).toContain("2026");
    expect(html).not.toContain("Pictures Writers");
  });

  it("appends the optional extra text and links", () => {
    const html = renderToStaticMarkup(
      <CopyrightBlockUi
        siteName="Acme"
        year={2026}
        extraText="All rights reserved."
        links={[
          { link: { type: "external", url: "https://example.com/", label: "Terms" } },
        ]}
      />,
    );

    expect(html).toContain("All rights reserved.");
    expect(html).toContain('href="https://example.com/"');
    expect(html).toContain(">Terms</a>");
  });
});
