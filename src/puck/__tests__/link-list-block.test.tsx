import type { PuckContext } from "@puckeditor/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { LinkListBlockProps } from "../blocks/LinkList/types";
import { renderLinkListBlock } from "../blocks/LinkList/render";
import { editorConfigForRegion } from "../region/editor-config";

const PUCK: PuckContext = {
  renderDropZone: () => null,
  metadata: {},
  isEditing: false,
  dragRef: null,
};

function render(props: LinkListBlockProps) {
  return renderToStaticMarkup(
    renderLinkListBlock({ id: "link-list", puck: PUCK, ...props }),
  );
}

describe("LinkList block", () => {
  it("renders a titled list of resolved links", () => {
    const html = render({
      title: "Risorse",
      links: [
        { link: { type: "external", url: "/blog/", label: "Blog" } },
        { link: { type: "external", url: "/about/", label: "Chi siamo" } },
      ],
    });

    expect(html).toContain("<ul");
    expect(html).toContain(">Risorse<");
    expect(html).toContain('href="/blog"');
    expect(html).toContain(">Blog</a>");
    expect(html).toContain('href="/about"');
    expect(html).toContain(">Chi siamo</a>");
  });

  it("renders unresolved entity links as plain text", () => {
    const html = render({
      title: "Menu",
      links: [{ link: { type: "page", pageId: "root-1", label: "About" } }],
    });

    expect(html).not.toContain("<a");
    expect(html).toContain(">About</span>");
  });

  it("renders resolved entity links stored in the legacy href shape", () => {
    const html = render({
      title: "Menu",
      links: [{ link: { label: "About", href: "/about/" } }],
    });

    expect(html).toContain('href="/about"');
    expect(html).toContain(">About</a>");
  });

  it("opens resolved external links in a new tab when requested", () => {
    const html = render({
      title: "Social",
      links: [
        {
          link: {
            type: "external",
            url: "https://example.com/",
            label: "Example",
            openInNewTab: true,
          },
        },
      ],
    });

    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noreferrer"');
  });

  it("omits empty rows instead of rendering dead links", () => {
    const html = render({
      title: "Empty",
      links: [{ link: { type: "external", url: "" } }, {}],
    });

    expect(html).toContain("<ul");
    expect(html).not.toContain("<li");
    expect(html).not.toContain("<a");
  });

  it("keeps the title semibold", () => {
    const html = render({ title: "Risorse", links: [] });

    expect(html).toContain('<h2 class="font-semibold">Risorse</h2>');
  });

  it("renders typography and dimension as responsive CSS custom properties", () => {
    const html = render({
      title: "Risorse",
      links: [{ link: { type: "external", url: "/blog/", label: "Blog" } }],
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

  it("exposes title, links, dimension and typography fields", () => {
    const linkList = editorConfigForRegion("FOOTER").components.LinkList;

    expect(linkList?.fields).toHaveProperty("title");
    expect(linkList?.fields).toHaveProperty("links");
    expect(linkList?.fields).toHaveProperty("dimension");
    expect(linkList?.fields).toHaveProperty("typography");
  });
});
