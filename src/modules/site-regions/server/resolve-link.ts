import "server-only";

import { db } from "@/shared/lib/db";

import {
  isSmartLink,
  type LinkProps,
  type SmartLink,
} from "@/puck/fields/link/types";

/**
 * A SmartLink after server-side resolution.
 *
 * `href` is `null` when the target does not exist or is not published. The
 * renderer turns those links into plain text, keeping the configured label so
 * the layout still reads correctly.
 */
export interface ResolvedLink {
  href: string | null;
  label: string;
  openInNewTab?: boolean;
  broken: boolean;
}

function broken(label: string | undefined): ResolvedLink {
  return { href: null, label: label?.trim() ?? "", broken: true };
}

function resolveExternal(link: Extract<SmartLink, { type: "external" }>, label: string | undefined) {
  const url = link.url.trim();

  if (url.length === 0) return broken(label);

  return {
    href: url,
    label: label?.trim() || url,
    openInNewTab: link.openInNewTab,
    broken: false,
  };
}

/**
 * Resolve a SmartLink to its final URL and label.
 *
 * Entity links are resolved against the **published** version of their root.
 * A draft-only page/post/product is therefore treated as missing: linking to it
 * would send a visitor to a 404. Categories have no versioning, so their title
 * and slug are always available.
 */
export async function resolveSmartLink(link: LinkProps): Promise<ResolvedLink> {
  const label = link.label;

  switch (link.type) {
    case "external":
      return resolveExternal(link, label);

    case "page": {
      const root = await db.pageRoot.findUnique({
        where: { id: link.pageId },
        select: {
          slug: true,
          liveVersion: { select: { title: true } },
        },
      });

      if (!root?.liveVersion) return broken(label);

      return {
        href: `/${root.slug}/`,
        label: label?.trim() || root.liveVersion.title,
        broken: false,
      };
    }

    case "post": {
      const root = await db.postRoot.findUnique({
        where: { id: link.postId },
        select: {
          slug: true,
          liveVersion: { select: { title: true } },
        },
      });

      if (!root?.liveVersion) return broken(label);

      return {
        href: `/${root.slug}/`,
        label: label?.trim() || root.liveVersion.title,
        broken: false,
      };
    }

    case "product": {
      const root = await db.productRoot.findUnique({
        where: { id: link.productId },
        select: {
          slug: true,
          liveVersion: {
            select: {
              title: true,
              category: { select: { slug: true } },
            },
          },
        },
      });

      if (!root?.liveVersion) return broken(label);

      const categorySlug = root.liveVersion.category?.slug;
      if (!categorySlug) return broken(label);

      return {
        href: `/shop/${categorySlug}/${root.slug}/`,
        label: label?.trim() || root.liveVersion.title,
        broken: false,
      };
    }

    case "category": {
      const category = await db.category.findUnique({
        where: { id: link.categoryId },
        select: { title: true, slug: true },
      });

      if (!category) return broken(label);

      return {
        href: `/blog/${category.slug}/`,
        label: label?.trim() || category.title,
        broken: false,
      };
    }

    case "productCategory": {
      const category = await db.productCategory.findUnique({
        where: { id: link.productCategoryId },
        select: { title: true, slug: true },
      });

      if (!category) return broken(label);

      return {
        href: `/shop/${category.slug}/`,
        label: label?.trim() || category.title,
        broken: false,
      };
    }
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Recursively replace every SmartLink found in a Puck document with its
 * resolved `{ label, href }` shape.
 *
 * The walk is value-based rather than block-based, so it also covers the
 * `links[]` arrays of future blocks (LinkList, NavbarBlock) and any nested
 * slots or zones. The input is cloned so the stored document, and the editor
 * that reads it, keep the original SmartLink props.
 */
export async function resolveSmartLinksInPuckData<T>(puckData: T): Promise<T> {
  const data = structuredClone(puckData);
  await resolveNode(data);
  return data;
}

async function resolveNode(node: unknown): Promise<void> {
  if (Array.isArray(node)) {
    for (const item of node) {
      await resolveNode(item);
    }
    return;
  }

  if (!isPlainObject(node)) return;

  for (const [key, value] of Object.entries(node)) {
    if (isSmartLink(value)) {
      const resolved = await resolveSmartLink(value);

      node[key] = {
        label: resolved.label,
        href: resolved.href ?? undefined,
        openInNewTab: resolved.openInNewTab,
      };
      continue;
    }

    await resolveNode(value);
  }
}
