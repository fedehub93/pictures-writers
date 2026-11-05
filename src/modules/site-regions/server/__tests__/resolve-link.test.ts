import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ContentStatus, ProductType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { getPublishedPageBySlug } from "@/modules/pages/server/queries";

import type { LinkProps } from "@/puck/fields/link/types";

import {
  resolveSmartLink,
  resolveSmartLinksInPuckData,
} from "../resolve-link";
import { getLiveRegionByKey } from "../queries/get-live-region-by-key";

const pageRootIds: string[] = [];
const postRootIds: string[] = [];
const productRootIds: string[] = [];
const categoryIds: string[] = [];
const productCategoryIds: string[] = [];

function unique(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

async function createPage(title: string, published = true) {
  const slug = unique("page");
  const root = await db.pageRoot.create({
    data: {
      slug,
      versions: {
        create: {
          title,
          version: 1,
          status: published ? ContentStatus.PUBLISHED : ContentStatus.DRAFT,
          publishedAt: published ? new Date() : null,
        },
      },
    },
    include: { versions: true },
  });

  pageRootIds.push(root.id);

  if (published) {
    await db.pageRoot.update({
      where: { id: root.id },
      data: { liveVersionId: root.versions[0]!.id },
    });
  }

  return { root, slug };
}

async function createPost(title: string, published = true) {
  const slug = unique("post");
  const root = await db.postRoot.create({
    data: {
      slug,
      versions: {
        create: {
          title,
          version: 1,
          status: published ? ContentStatus.PUBLISHED : ContentStatus.DRAFT,
          publishedAt: published ? new Date() : null,
        },
      },
    },
    include: { versions: true },
  });

  postRootIds.push(root.id);

  if (published) {
    await db.postRoot.update({
      where: { id: root.id },
      data: { liveVersionId: root.versions[0]!.id },
    });
  }

  return { root, slug };
}

async function createCategory(title: string) {
  const category = await db.category.create({
    data: { title, slug: unique("blog-category") },
  });
  categoryIds.push(category.id);
  return category;
}

async function createProductCategory(title: string) {
  const category = await db.productCategory.create({
    data: { title, slug: unique("product-category") },
  });
  productCategoryIds.push(category.id);
  return category;
}

async function createProduct(
  title: string,
  categoryId: string | null = null,
  published = true,
) {
  const slug = unique("product");
  const root = await db.productRoot.create({
    data: {
      slug,
      type: ProductType.EBOOK,
      versions: {
        create: {
          title,
          version: 1,
          status: published ? ContentStatus.PUBLISHED : ContentStatus.DRAFT,
          publishedAt: published ? new Date() : null,
          categoryId,
        },
      },
    },
    include: { versions: true },
  });

  productRootIds.push(root.id);

  if (published) {
    await db.productRoot.update({
      where: { id: root.id },
      data: { liveVersionId: root.versions[0]!.id },
    });
  }

  return { root, slug };
}

beforeEach(async () => {
  await db.siteRegion.deleteMany({});
});

afterEach(async () => {
  await db.siteRegion.deleteMany({});

  if (productRootIds.length > 0) {
    await db.productRoot.deleteMany({ where: { id: { in: productRootIds } } });
  }
  if (postRootIds.length > 0) {
    await db.postRoot.deleteMany({ where: { id: { in: postRootIds } } });
  }
  if (pageRootIds.length > 0) {
    await db.pageRoot.deleteMany({ where: { id: { in: pageRootIds } } });
  }
  if (productCategoryIds.length > 0) {
    await db.productCategory.deleteMany({
      where: { id: { in: productCategoryIds } },
    });
  }
  if (categoryIds.length > 0) {
    await db.category.deleteMany({ where: { id: { in: categoryIds } } });
  }

  pageRootIds.length = 0;
  postRootIds.length = 0;
  productRootIds.length = 0;
  categoryIds.length = 0;
  productCategoryIds.length = 0;
});

describe("resolveSmartLink", () => {
  it("resolves an external URL and uses it as the label fallback", async () => {
    await expect(
      resolveSmartLink({
        type: "external",
        url: "https://example.com/",
        openInNewTab: true,
      }),
    ).resolves.toEqual({
      href: "https://example.com/",
      label: "https://example.com/",
      openInNewTab: true,
      broken: false,
    });
  });

  it("keeps an explicit label on an external link", async () => {
    const resolved = await resolveSmartLink({
      type: "external",
      url: "https://example.com/",
      label: "Example",
    });

    expect(resolved.label).toBe("Example");
  });

  it("treats an empty external URL as broken", async () => {
    const resolved = await resolveSmartLink({
      type: "external",
      url: "   ",
      label: "Empty",
    });

    expect(resolved).toEqual({ href: null, label: "Empty", broken: true });
  });

  it("resolves a published page to its slug and title", async () => {
    const { root } = await createPage("Chi siamo");

    const resolved = await resolveSmartLink({
      type: "page",
      pageId: root.id,
    });

    expect(resolved).toEqual({
      href: `/${root.slug}/`,
      label: "Chi siamo",
      broken: false,
    });
  });

  it("prefers the configured label over the entity title", async () => {
    const { root } = await createPage("Chi siamo");

    const resolved = await resolveSmartLink({
      type: "page",
      pageId: root.id,
      label: "About us",
    });

    expect(resolved.label).toBe("About us");
  });

  it("treats a page without a live version as broken", async () => {
    const { root } = await createPage("Bozza", false);

    const resolved = await resolveSmartLink({
      type: "page",
      pageId: root.id,
      label: "Bozza",
    });

    expect(resolved).toEqual({ href: null, label: "Bozza", broken: true });
  });

  it("treats an unknown page as broken", async () => {
    const resolved = await resolveSmartLink({
      type: "page",
      pageId: randomUUID(),
    });

    expect(resolved.broken).toBe(true);
    expect(resolved.href).toBeNull();
  });

  it("resolves a published post to its root slug", async () => {
    const { root } = await createPost("Come scrivere una scena");

    const resolved = await resolveSmartLink({
      type: "post",
      postId: root.id,
    });

    expect(resolved).toEqual({
      href: `/${root.slug}/`,
      label: "Come scrivere una scena",
      broken: false,
    });
  });

  it("resolves a product to its category and product slug", async () => {
    const category = await createProductCategory("eBook");
    const { root, slug } = await createProduct("Workbook", category.id);

    const resolved = await resolveSmartLink({
      type: "product",
      productId: root.id,
    });

    expect(resolved).toEqual({
      href: `/shop/${category.slug}/${slug}/`,
      label: "Workbook",
      broken: false,
    });
  });

  it("treats a product without a category as broken", async () => {
    const { root } = await createProduct("Senza categoria");

    const resolved = await resolveSmartLink({
      type: "product",
      productId: root.id,
    });

    expect(resolved.broken).toBe(true);
    expect(resolved.href).toBeNull();
  });

  it("resolves a blog category", async () => {
    const category = await createCategory("Sceneggiatura");

    const resolved = await resolveSmartLink({
      type: "category",
      categoryId: category.id,
    });

    expect(resolved).toEqual({
      href: `/blog/${category.slug}/`,
      label: "Sceneggiatura",
      broken: false,
    });
  });

  it("resolves a product category", async () => {
    const category = await createProductCategory("Corsi");

    const resolved = await resolveSmartLink({
      type: "productCategory",
      productCategoryId: category.id,
    });

    expect(resolved).toEqual({
      href: `/shop/${category.slug}/`,
      label: "Corsi",
      broken: false,
    });
  });

  it("treats a missing category as broken", async () => {
    await expect(
      resolveSmartLink({
        type: "category",
        categoryId: randomUUID(),
      }),
    ).resolves.toMatchObject({ href: null, broken: true });
  });
});

describe("resolveSmartLinksInPuckData", () => {
  it("resolves links in content, nested slots and zones without mutating the input", async () => {
    const { root } = await createPage("Pagina linkata");
    const external: LinkProps = {
      type: "external",
      url: "https://example.com/",
      label: "Example",
    };
    const pageLink: LinkProps = { type: "page", pageId: root.id };
    const brokenLink: LinkProps = {
      type: "page",
      pageId: randomUUID(),
      label: "Rimosso",
    };

    const data = {
      root: {},
      content: [
        {
          type: "Link",
          props: { id: "link-1", link: external },
        },
        {
          type: "Container",
          props: {
            id: "container-1",
            items: [
              {
                type: "Link",
                props: { id: "link-2", link: pageLink },
              },
            ],
          },
        },
        {
          type: "Link",
          props: { id: "link-3", link: brokenLink },
        },
        {
          // A pre-SmartLink document keeps rendering unchanged.
          type: "Link",
          props: { id: "link-4", link: { label: "Legacy", href: "/legacy/" } },
        },
      ],
      zones: {
        "container-1:slot": [
          {
            type: "Link",
            props: { id: "link-5", link: pageLink },
          },
        ],
      },
    };

    const resolved = await resolveSmartLinksInPuckData(data);

    expect(resolved.content[0]!.props.link).toEqual({
      label: "Example",
      href: "https://example.com/",
      openInNewTab: undefined,
    });
    expect(resolved.content[1]!.props.items![0]!.props.link).toEqual({
      label: "Pagina linkata",
      href: `/${root.slug}/`,
      openInNewTab: undefined,
    });
    expect(resolved.content[2]!.props.link).toEqual({
      label: "Rimosso",
      href: undefined,
      openInNewTab: undefined,
    });
    expect(resolved.content[3]!.props.link).toEqual({
      label: "Legacy",
      href: "/legacy/",
    });
    expect(resolved.zones["container-1:slot"]![0]!.props.link).toEqual({
      label: "Pagina linkata",
      href: `/${root.slug}/`,
      openInNewTab: undefined,
    });

    // The stored/editor document is left untouched.
    expect((data.content[0]!.props.link as LinkProps).type).toBe("external");
  });

  it("is used when a published page is fetched", async () => {
    const target = await createPage("Pagina target");
    const source = await createPage("Pagina con link");

    await db.pageVersion.update({
      where: { id: source.root.versions[0]!.id },
      data: {
        puckData: {
          root: {},
          content: [
            {
              type: "Link",
              props: {
                id: "page-link",
                link: { type: "page", pageId: target.root.id },
              },
            },
          ],
        } as unknown as PrismaJson.PuckData,
      },
    });

    const page = await getPublishedPageBySlug(source.slug);
    const document = page!.puckData as unknown as {
      content: Array<{ props: { link: { label: string; href: string } } }>;
    };

    expect(document.content[0]!.props.link).toEqual({
      label: "Pagina target",
      href: `/${target.root.slug}/`,
      openInNewTab: undefined,
    });
  });

  it("is used when a live region is fetched", async () => {
    const { root } = await createPage("Pagina del footer");

    const siteRegion = await db.siteRegion.create({
      data: {
        key: "HEADER",
        versions: {
          create: {
            version: 1,
            status: ContentStatus.PUBLISHED,
            puckData: {
              root: {},
              content: [
                {
                  type: "Link",
                  props: {
                    id: "header-link",
                    link: { type: "page", pageId: root.id },
                  },
                },
              ],
            } as unknown as PrismaJson.PuckData,
          },
        },
      },
      include: { versions: true },
    });

    await db.siteRegion.update({
      where: { id: siteRegion.id },
      data: { liveVersionId: siteRegion.versions[0]!.id },
    });

    const live = await getLiveRegionByKey("HEADER");
    const document = live!.puckData as unknown as {
      content: Array<{ props: { link: { label: string; href: string } } }>;
    };

    expect(document.content[0]!.props.link).toEqual({
      label: "Pagina del footer",
      href: `/${root.slug}/`,
      openInNewTab: undefined,
    });
  });
});
