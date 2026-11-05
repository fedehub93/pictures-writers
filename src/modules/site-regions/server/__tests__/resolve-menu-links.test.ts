import { randomUUID } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import { ContentStatus } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import type {
  NavItem,
  NavItemUi,
} from "@/puck/blocks/NavbarBlock/types";

import { resolveMenuLinks } from "../resolve-menu-links";

const pageRootIds: string[] = [];

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

afterEach(async () => {
  if (pageRootIds.length > 0) {
    await db.pageRoot.deleteMany({ where: { id: { in: pageRootIds } } });
    pageRootIds.length = 0;
  }
});

describe("resolveMenuLinks", () => {
  it("resolves every menu item type and preserves its metadata", async () => {
    const page = await createPage("Chi siamo");
    const menu: NavItem[] = [
      {
        type: "link",
        label: "Chi siamo",
        link: { type: "page", pageId: page.root.id },
      },
      {
        type: "column",
        label: "Risorse",
        items: [
          {
            label: "Blog",
            link: { type: "external", url: "/blog/", openInNewTab: true },
          },
          {
            label: "Prossimamente",
            link: { type: "page", pageId: randomUUID() },
          },
        ],
      },
      {
        type: "card",
        label: "Workbook",
        description: "Una guida pratica.",
        imageUrl: "/cover.png",
        link: { type: "page", pageId: page.root.id },
      },
      {
        type: "cta",
        label: "Contatti",
        link: { type: "external", url: "/contatti/" },
        variant: "primary",
      },
    ];

    const resolved = await resolveMenuLinks(menu);

    expect(resolved[0]).toEqual({
      type: "link",
      label: "Chi siamo",
      link: {
        label: "Chi siamo",
        href: `/${page.root.slug}/`,
        openInNewTab: undefined,
      },
    });

    expect(resolved[1]).toEqual({
      type: "column",
      label: "Risorse",
      items: [
        {
          label: "Blog",
          link: {
            label: "Blog",
            href: "/blog/",
            openInNewTab: true,
          },
        },
        {
          label: "Prossimamente",
          link: {
            label: "Prossimamente",
            href: undefined,
            openInNewTab: undefined,
          },
        },
      ],
    });

    expect(resolved[2]).toEqual({
      type: "card",
      label: "Workbook",
      description: "Una guida pratica.",
      imageUrl: "/cover.png",
      link: {
        label: "Workbook",
        href: `/${page.root.slug}/`,
        openInNewTab: undefined,
      },
    });

    expect(resolved[3]).toEqual({
      type: "cta",
      label: "Contatti",
      link: {
        label: "Contatti",
        href: "/contatti/",
        openInNewTab: undefined,
      },
      variant: "primary",
    });
  });

  it("prefers an explicit link label over the entity title", async () => {
    const page = await createPage("Pagina istituzionale");

    const [resolved] = await resolveMenuLinks([
      {
        type: "link",
        label: "About",
        link: { type: "page", pageId: page.root.id, label: "Chi siamo" },
      },
    ]);

    expect(resolved).toMatchObject({
      type: "link",
      link: { label: "Chi siamo" },
    });
  });

  it("falls back to the menu label when an entity is missing", async () => {
    const [resolved] = await resolveMenuLinks([
      {
        type: "link",
        label: "Rimosso",
        link: { type: "page", pageId: randomUUID() },
      },
    ]);

    expect(resolved).toEqual({
      type: "link",
      label: "Rimosso",
      link: {
        label: "Rimosso",
        href: undefined,
        openInNewTab: undefined,
      },
    });
  });

  it("accepts links that were already resolved by the generic walker", async () => {
    const menu: NavItemUi[] = [
      {
        type: "link",
        label: "Blog",
        link: { label: "Blog", href: "/blog/", openInNewTab: false },
      },
    ];

    const [resolved] = await resolveMenuLinks(menu);

    expect(resolved).toEqual({
      type: "link",
      label: "Blog",
      link: {
        label: "Blog",
        href: "/blog/",
        openInNewTab: false,
      },
    });
  });

  it("does not mutate the stored menu tree", async () => {
    const page = await createPage("Intatta");
    const menu: NavItem[] = [
      {
        type: "link",
        label: "Intatta",
        link: { type: "page", pageId: page.root.id },
      },
    ];

    await resolveMenuLinks(menu);

    expect(menu[0]).toEqual({
      type: "link",
      label: "Intatta",
      link: { type: "page", pageId: page.root.id },
    });
  });

  it("returns an empty list for an empty menu", async () => {
    await expect(resolveMenuLinks(undefined)).resolves.toEqual([]);
    await expect(resolveMenuLinks([])).resolves.toEqual([]);
  });
});
