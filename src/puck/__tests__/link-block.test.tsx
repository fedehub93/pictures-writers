import type { PuckContext } from "@puckeditor/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { LinkProps } from "../fields/link/types";

import { renderLinkBlock } from "../blocks/Link/render";
import { LinkBlockUi } from "../blocks/Link/ui/link";

const PUCK: PuckContext = {
  renderDropZone: () => null,
  metadata: {},
  isEditing: false,
  dragRef: null,
};

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

  it("renders the anchor as its own root without a full-width wrapper", () => {
    const link: LinkProps = {
      type: "external",
      url: "https://example.com/",
      label: "Example",
    };

    const html = renderToStaticMarkup(<LinkBlockUi link={link} styleVars={{}} />);
    const rootTag = html.slice(0, html.indexOf(">") + 1);

    expect(rootTag.startsWith("<a ")).toBe(true);
    expect(rootTag).not.toContain("w-full");
  });

  it("keeps rendering legacy { label, href } documents", () => {
    const html = renderToStaticMarkup(
      <LinkBlockUi link={{ label: "Legacy", href: "/legacy/" }} styleVars={{}} />,
    );

    expect(html).toContain('href="/legacy"');
    expect(html).toContain(">Legacy</a>");
  });
});

/**
 * A Link root is the anchor, so it is the flex or grid item its parent lays
 * out. A block base width keeps `auto` from stretching, and an authored width
 * still outranks it. Neither case is a stored document value.
 */
describe("Link block base width", () => {
  const link: LinkProps = {
    type: "external",
    url: "https://example.com/",
    label: "Example",
  };

  /** The block root is the anchor itself, so its style is the contract. */
  function rootTag(html: string) {
    return html.slice(0, html.indexOf(">") + 1);
  }

  it("emits the natural width on an unauthored dimension", () => {
    const html = renderToStaticMarkup(
      renderLinkBlock({ id: "link", link, puck: PUCK }),
    );

    expect(rootTag(html)).toContain("--w-d:fit-content");
  });

  it("lets an authored width win over the base width", () => {
    const html = renderToStaticMarkup(
      renderLinkBlock({
        id: "link",
        link,
        dimension: { desktop: { width: "50%" } },
        puck: PUCK,
      }),
    );

    expect(rootTag(html)).toContain("--w-d:50%");
    expect(rootTag(html)).not.toContain("fit-content");
  });

  it("hugs a max width instead of filling the container", () => {
    const html = renderToStaticMarkup(
      renderLinkBlock({
        id: "link",
        link,
        dimension: { desktop: { maxWidth: "30rem" } },
        puck: PUCK,
      }),
    );

    expect(rootTag(html)).toContain("--w-d:fit-content");
    expect(rootTag(html)).toContain("--mw-d:30rem");
    expect(rootTag(html)).not.toContain("--w-d:100%");
  });

  it("still applies the base width when the document authored other dimension values", () => {
    // Nearly every existing Link authored padding or margins. A document
    // default would have been dropped by Puck's shallow merge for exactly these
    // documents; the block base width is read independently of the object.
    const html = renderToStaticMarkup(
      renderLinkBlock({
        id: "link",
        link,
        dimension: { desktop: { paddingTop: "12px" } },
        puck: PUCK,
      }),
    );

    expect(rootTag(html)).toContain("--w-d:fit-content");
    expect(rootTag(html)).toContain("--pt-d:12px");
  });

  it("renders the same markup while editing as on the published page", () => {
    const props = {
      id: "link",
      link,
      dimension: { desktop: { maxWidth: "30rem" } },
      puck: PUCK,
    };

    const published = renderToStaticMarkup(renderLinkBlock(props));
    const editing = renderToStaticMarkup(
      renderLinkBlock({ ...props, puck: { ...PUCK, isEditing: true } }),
    );

    expect(editing).toBe(published);
  });
});
