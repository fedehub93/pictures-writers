import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { LinkProps } from "../fields/link/types";

import { LinkBlockUi } from "../blocks/Link/ui/link";

describe("Link block", () => {
  it("renders an external smart link as an anchor", () => {
    const link: LinkProps = {
      type: "external",
      url: "https://example.com/",
      label: "Example",
    };

    const html = renderToStaticMarkup(<LinkBlockUi link={link} styleVars={{}} />);

    expect(html).toContain('href="https://example.com/"');
    expect(html).toContain(">Example</a>");
  });

  it("opens external links in a new tab when requested", () => {
    const link: LinkProps = {
      type: "external",
      url: "https://example.com/",
      label: "Example",
      openInNewTab: true,
    };

    const html = renderToStaticMarkup(<LinkBlockUi link={link} styleVars={{}} />);

    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noreferrer"');
  });

  it("renders an unresolved entity link as plain text", () => {
    const link: LinkProps = { type: "page", pageId: "root-1", label: "About" };

    const html = renderToStaticMarkup(<LinkBlockUi link={link} styleVars={{}} />);

    expect(html).not.toContain("<a");
    expect(html).toContain(">About</span>");
  });

  it("renders a broken resolved link as plain text", () => {
    const html = renderToStaticMarkup(
      <LinkBlockUi link={{ label: "Removed page" }} styleVars={{}} />,
    );

    expect(html).not.toContain("<a");
    expect(html).toContain(">Removed page</span>");
  });

  it("keeps rendering legacy { label, href } documents", () => {
    const html = renderToStaticMarkup(
      <LinkBlockUi link={{ label: "Legacy", href: "/legacy/" }} styleVars={{}} />,
    );

    expect(html).toContain('href="/legacy"');
    expect(html).toContain(">Legacy</a>");
  });
});
