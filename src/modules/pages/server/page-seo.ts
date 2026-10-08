import "server-only";

import { randomUUID } from "node:crypto";

import { Prisma, type Seo } from "@/generated/prisma";

import type { PageUpdateSeoValues } from "../schemas";

/**
 * The mutable SEO fields a caller can override when cloning a page's SEO row.
 * For nullable fields, `undefined` keeps the source value and `null` clears it;
 * `noIndex`/`noFollow` are always provided by the caller.
 */
export type PageSeoOverrides = Pick<
  PageUpdateSeoValues,
  | "title"
  | "description"
  | "canonicalUrl"
  | "ogTwitterTitle"
  | "ogTwitterDescription"
  | "noIndex"
  | "noFollow"
>;

/**
 * Create a fresh SEO row for a page version when the source has none. Mirrors
 * `createPageSeo` defaults so a version created outside the legacy `Page` flow
 * still gets a complete SEO record.
 */
export async function createPageVersionSeo(
  tx: Prisma.TransactionClient,
  title: string,
  overrides: PageSeoOverrides,
): Promise<Seo> {
  const id = randomUUID();

  return tx.seo.create({
    data: {
      id,
      title: overrides.title ?? title,
      description:
        overrides.description !== undefined ? overrides.description : "",
      canonicalUrl:
        overrides.canonicalUrl !== undefined ? overrides.canonicalUrl : null,
      version: 1,
      noIndex: overrides.noIndex ?? false,
      noFollow: overrides.noFollow ?? false,
      ogTwitterType: "card",
      ogTwitterTitle:
        overrides.ogTwitterTitle !== undefined
          ? overrides.ogTwitterTitle
          : title,
      ogTwitterDescription:
        overrides.ogTwitterDescription !== undefined
          ? overrides.ogTwitterDescription
          : "",
      ogTwitterLocale: "it_IT",
      rootId: id,
    },
  });
}

/**
 * Copy a page version's SEO onto a new row, applying the caller's overrides.
 * The copy owns itself (`rootId = id`), so it never keeps a reference back to
 * the row it was cloned from — deleting either row never cascades into the
 * other. `undefined` overrides fall back to the source; `null` clears.
 */
export async function clonePageSeo(
  tx: Prisma.TransactionClient,
  sourceSeoId: string,
  overrides: PageSeoOverrides,
): Promise<Seo | null> {
  const source = await tx.seo.findUnique({ where: { id: sourceSeoId } });
  if (!source) return null;

  const id = randomUUID();

  return tx.seo.create({
    data: {
      id,
      title: overrides.title ?? source.title,
      description:
        overrides.description !== undefined
          ? overrides.description
          : source.description,
      canonicalUrl:
        overrides.canonicalUrl !== undefined
          ? overrides.canonicalUrl
          : source.canonicalUrl,
      version: source.version,
      noIndex: overrides.noIndex ?? source.noIndex,
      noFollow: overrides.noFollow ?? source.noFollow,
      ogTwitterType: source.ogTwitterType,
      ogTwitterTitle:
        overrides.ogTwitterTitle !== undefined
          ? overrides.ogTwitterTitle
          : source.ogTwitterTitle,
      ogTwitterDescription:
        overrides.ogTwitterDescription !== undefined
          ? overrides.ogTwitterDescription
          : source.ogTwitterDescription,
      ogTwitterImageId: source.ogTwitterImageId,
      ogTwitterLocale: source.ogTwitterLocale,
      ogTwitterUrl: source.ogTwitterUrl,
      rootId: id,
    },
  });
}
