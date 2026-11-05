import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LinkListBlockUi } from "../blocks/LinkList/ui/link-list";

describe("LinkList block", () => {
  it("renders a titled list of resolved links", () => {
    const html = renderToStaticMarkup(
      <LinkListBlockUi
        title="Risorse"
        links={[
          { link: { type: "external", url: "/blog/", label: "Blog" } },
          { link: { type: "external", url: "/about/", label: "Chi siamo" } },
        ]}
      />,
    );

    expect(html).toContain("<ul");
    expect(html).toContain(">Risorse<");
    expect(html).toContain('href="/blog"');
    expect(html).toContain(">Blog</a>");
    expect(html).toContain('href="/about"');
    expect(html).toContain(">Chi siamo</a>");
  });

  it("renders unresolved entity links as plain text", () => {
    const html = renderToStaticMarkup(
      <LinkListBlockUi
        title="Menu"
        links={[
          { link: { type: "page", pageId: "root-1", label: "About" } },
        ]}
      />,
    );

    expect(html).not.toContain("<a");
    expect(html).toContain(">About</span>");
  });

  it("renders resolved entity links stored in the legacy href shape", () => {
    const html = renderToStaticMarkup(
      <LinkListBlockUi
        title="Menu"
        links={[{ link: { label: "About", href: "/about/" } }]}
      />,
    );

    expect(html).toContain('href="/about"');
    expect(html).toContain(">About</a>");
  });

  it("opens resolved external links in a new tab when requested", () => {
    const html = renderToStaticMarkup(
      <LinkListBlockUi
        title="Social"
        links={[
          {
            link: {
              type: "external",
              url: "https://example.com/",
              label: "Example",
              openInNewTab: true,
            },
          },
        ]}
      />,
    );

    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noreferrer"');
  });

  it("omits empty rows instead of rendering dead links", () => {
    const html = renderToStaticMarkup(
      <LinkListBlockUi
        title="Empty"
        links={[{ link: { type: "external", url: "" } }, {}]}
      />,
    );

    expect(html).toContain("<ul");
    expect(html).not.toContain("<li");
    expect(html).not.toContain("<a");
  });
});
