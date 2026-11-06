import type { CustomField } from "@puckeditor/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { CopyrightContentField } from "../blocks/Copyright/field";
import type { CopyrightBlockContent } from "../blocks/Copyright/types";
import { LinkListContentField } from "../blocks/LinkList/field";
import type { LinkListBlockContent } from "../blocks/LinkList/types";
import {
  createLinkListItem,
  moveLinkListItem,
  removeLinkListItem,
  updateLinkListItem,
} from "../fields/link/lib/links";
import type { LinkListItem } from "../fields/link/types";
import { LinksEditor } from "../fields/link/ui/links-editor";

/**
 * The editor only needs the tRPC hook to build entity-picker query options.
 * External links do not run a query, so a static fake is enough to render the
 * real link field controls.
 */
vi.mock("@/trpc/client", () => {
  const queryOptions = (input: unknown) => ({
    queryKey: ["links-editor-test", input],
    queryFn: () => new Promise<never>(() => undefined),
  });
  const getMany = { getMany: { queryOptions } };

  return {
    useTRPC: () => ({
      pages: getMany,
      posts: getMany,
      products: getMany,
      categories: getMany,
      productCategories: getMany,
    }),
  };
});

function render(links: LinkListItem[]) {
  return renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <LinksEditor links={links} onChange={() => undefined} />
    </QueryClientProvider>,
  );
}

function renderContentField<T>(
  field: CustomField<T | undefined>,
  value: T | undefined,
) {
  return renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      {field.render({
        field,
        name: "content",
        id: "content",
        value,
        onChange: () => undefined,
      })}
    </QueryClientProvider>,
  );
}

describe("shared links editor", () => {
  it("renders one inline link control per row", () => {
    const html = render([
      { link: { type: "external", url: "/blog/", label: "Blog" } },
      { link: { type: "page", pageId: "root-1", label: "About" } },
    ]);

    expect(html).toContain('id="link-0-type"');
    expect(html).toContain('id="link-1-type"');
    expect(html).toContain(">Blog<");
    expect(html).toContain(">About<");
  });

  it("renders the real link field controls, not a placeholder", () => {
    const html = render([
      { link: { type: "external", url: "/blog/", label: "Blog" } },
    ]);

    expect(html).toContain("Link type");
    expect(html).toContain("Label");
    expect(html).toContain("URL");
    expect(html).toContain("Open in new tab");
    expect(html).toContain('value="/blog/"');
  });

  it("keeps the control ids unique across rows", () => {
    const html = render([
      { link: { type: "external", url: "/one/", label: "One" } },
      { link: { type: "external", url: "/two/", label: "Two" } },
    ]);

    expect(html).toContain('id="link-0-label"');
    expect(html).toContain('id="link-1-label"');
    expect(html).toContain('id="link-0-url"');
    expect(html).toContain('id="link-1-url"');
  });

  it("normalizes legacy links before handing them to the link field", () => {
    const html = render([{ link: { label: "Legacy", href: "/legacy/" } }]);

    expect(html).toContain('id="link-0-url"');
    expect(html).toContain('value="/legacy/"');
    expect(html).toContain(">Legacy<");
  });

  it("offers add, remove and reorder controls", () => {
    const empty = render([]);
    const twoRows = render([
      { link: { type: "external", url: "/one/", label: "One" } },
      { link: { type: "external", url: "/two/", label: "Two" } },
    ]);

    expect(empty).toContain("Add a link to build the list.");
    expect(empty).toContain(">Add link<");
    expect(twoRows).toContain('aria-label="Move link up"');
    expect(twoRows).toContain('aria-label="Move link down"');
    expect(twoRows).toContain('aria-label="Remove link"');
  });

  it("is wired into the Link list and Copyright content sections", () => {
    const linkList = renderContentField<LinkListBlockContent>(
      LinkListContentField as CustomField<LinkListBlockContent | undefined>,
      { links: [{ link: { type: "external", url: "/blog/", label: "Blog" } }] },
    );
    const copyright = renderContentField<CopyrightBlockContent>(
      CopyrightContentField as CustomField<
        CopyrightBlockContent | undefined
      >,
      {
        links: [
          { link: { type: "external", url: "/terms/", label: "Terms" } },
        ],
      },
    );

    expect(linkList).toContain(">Blog<");
    expect(linkList).toContain('aria-label="Remove link"');
    expect(copyright).toContain(">Terms<");
    expect(copyright).toContain('aria-label="Remove link"');
  });

  it("disables the reorder controls at the edges", () => {
    const html = render([
      { link: { type: "external", url: "/one/", label: "One" } },
      { link: { type: "external", url: "/two/", label: "Two" } },
    ]);

    // Only the first "up" and the last "down" are disabled.
    expect(html.match(/disabled=""/g)).toHaveLength(2);
  });
});

describe("links editor item operations", () => {
  it("creates a fresh empty external link", () => {
    const first = createLinkListItem();
    const second = createLinkListItem();

    expect(first).toEqual({ link: { type: "external", url: "" } });
    expect(first).not.toBe(second);
    expect(first.link).not.toBe(second.link);
  });

  it("updates a single row without mutating the list", () => {
    const items: LinkListItem[] = [
      { link: { type: "external", url: "/one/", label: "One" } },
      { link: { type: "external", url: "/two/", label: "Two" } },
    ];

    const next = updateLinkListItem(items, 1, {
      link: { type: "post", postId: "post-1", label: "Post" },
    });

    expect(next).not.toBe(items);
    expect(next[0]).toBe(items[0]);
    expect(next[1]).toEqual({
      link: { type: "post", postId: "post-1", label: "Post" },
    });
    expect(items[1]).toEqual({
      link: { type: "external", url: "/two/", label: "Two" },
    });
  });

  it("removes a row", () => {
    const items: LinkListItem[] = [
      { link: { type: "external", url: "/one/", label: "One" } },
      { link: { type: "external", url: "/two/", label: "Two" } },
    ];

    expect(removeLinkListItem(items, 0)).toEqual([items[1]]);
  });

  it("moves a row up and down, ignoring moves outside the list", () => {
    const items: LinkListItem[] = [
      { link: { type: "external", url: "/one/", label: "One" } },
      { link: { type: "external", url: "/two/", label: "Two" } },
      { link: { type: "external", url: "/three/", label: "Three" } },
    ];

    expect(moveLinkListItem(items, 1, -1)).toEqual([
      items[1],
      items[0],
      items[2],
    ]);
    expect(moveLinkListItem(items, 1, 1)).toEqual([
      items[0],
      items[2],
      items[1],
    ]);
    expect(moveLinkListItem(items, 0, -1)).toBe(items);
    expect(moveLinkListItem(items, 2, 1)).toBe(items);
  });
});
