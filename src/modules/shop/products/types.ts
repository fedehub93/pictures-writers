import { inferRouterOutputs } from "@trpc/server";

import { ProductType } from "@/generated/prisma";
import { AppRouter } from "@/trpc/routers/_app";

export type ProductsGetMany =
  inferRouterOutputs<AppRouter>["products"]["getMany"];

/**
 * One row of the admin product list: a logical product (root) projected onto
 * one of its versions (the current version by default, or the live version when
 * `products.getMany` is called with `publishedOnly`). Shared by the list table,
 * the product picker modal and the widget/embedded product renderers.
 */
export type ProductListItem = ProductsGetMany["items"][number];

/**
 * Product metadata is type-specific, so it is modelled as a discriminated
 * union keyed by `type`. These types are the single domain definition shared
 * by the admin forms, the public renderers and the blog/widget/mail modules.
 */

export enum EbookType {
  PDF = "pdf",
  EPUB = "epub",
  MOBI = "mobi",
}

export type EbookFormat = {
  type: EbookType;
  url: string;
  size: number;
  pages: number;
};

export type WebinarLesson = {
  title?: string;
  date: string;
  startTime: string;
  endTime: string;
};

export type EbookMetadata = {
  type: "EBOOK";
  formats: EbookFormat[];
  edition: string;
  publishedAt: Date | null;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    imageUrl: string;
  } | null;
};

export type AffiliateMetadata = {
  type: "AFFILIATE";
  url: string;
};

export type WebinarMetadata = {
  type: "WEBINAR";
  seats: number;
  platform: string;
  lessons: WebinarLesson[];
  isOpen: boolean;
};

export type ServiceMetadata = {
  type: "SERVICE";
  serviceType: string;
  competitorPrice: number;
  target: string;
  attachamentUrl: string;
  features: { title: string; Icon: string; description: string }[];
};

export type ProductMetadata =
  | EbookMetadata
  | AffiliateMetadata
  | WebinarMetadata
  | ServiceMetadata;

export function isValidEbookFormat(
  format: string | null,
): format is EbookType {
  return format === "pdf" || format === "epub" || format === "mobi";
}

export function isEbookMetadata(metadata: unknown): metadata is EbookMetadata {
  return isMetadataOfType(metadata, ProductType.EBOOK);
}

export function isAffiliateMetadata(
  metadata: unknown,
): metadata is AffiliateMetadata {
  return isMetadataOfType(metadata, ProductType.AFFILIATE);
}

export function isWebinarMetadata(
  metadata: unknown,
): metadata is WebinarMetadata {
  return isMetadataOfType(metadata, ProductType.WEBINAR);
}

export function isServiceMetadata(
  metadata: unknown,
): metadata is ServiceMetadata {
  return isMetadataOfType(metadata, ProductType.SERVICE);
}

function isMetadataOfType(
  metadata: unknown,
  type: ProductType,
): metadata is ProductMetadata {
  return (
    typeof metadata === "object" &&
    metadata !== null &&
    "type" in metadata &&
    (metadata as { type?: unknown }).type === type
  );
}
