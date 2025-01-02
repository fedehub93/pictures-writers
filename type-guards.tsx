import { ProductCategory, WidgetSection, WidgetType } from "@prisma/client";

import {
  AffiliateMetadata,
  EbookMetadata,
  EbookType,
  WidgetAuthorMetadata,
  WidgetCategoryMetadata,
  WidgetNewsletterMetadata,
  WidgetPostMetadata,
  WidgetProductMetadata,
  WidgetSearchMetadata,
  WidgetTagMetadata,
} from "@/types";

export function isValidEbookFormat(format: string | null): format is EbookType {
  return format === "pdf" || format === "epub" || format === "mobi";
}

export function isEbookMetadata(metadata: unknown): metadata is EbookMetadata {
  return (
    typeof metadata === "object" &&
    metadata !== null &&
    "type" in metadata &&
    typeof (metadata as any).type === "string" &&
    metadata.type === ProductCategory.EBOOK
  );
}

export function isAffiliateMetadata(
  metadata: unknown
): metadata is AffiliateMetadata {
  return (
    typeof metadata === "object" &&
    metadata !== null &&
    "type" in metadata &&
    typeof (metadata as any).type === "string" &&
    metadata.type === ProductCategory.AFFILIATE
  );
}

export function isValidWidgetMetadata(
  metadata: unknown
): metadata is WidgetPostMetadata {
  return (
    typeof metadata === "object" &&
    metadata !== null &&
    "type" in metadata &&
    typeof (metadata as any).type === "string"
  );
}

export function isWidgetSearchMetadata(
  metadata: unknown
): metadata is WidgetSearchMetadata {
  return (
    typeof metadata === "object" &&
    metadata !== null &&
    "type" in metadata &&
    typeof (metadata as any).type === "string" &&
    metadata.type === WidgetType.SEARCH_BOX
  );
}

export function isWidgetPostMetadata(
  metadata: unknown
): metadata is WidgetPostMetadata {
  return (
    typeof metadata === "object" &&
    metadata !== null &&
    "type" in metadata &&
    typeof (metadata as any).type === "string" &&
    metadata.type === WidgetType.POST
  );
}

export function isWidgetCategoryMetadata(
  metadata: unknown
): metadata is WidgetCategoryMetadata {
  return (
    typeof metadata === "object" &&
    metadata !== null &&
    "type" in metadata &&
    typeof (metadata as any).type === "string" &&
    metadata.type === WidgetType.CATEGORY
  );
}

export function isWidgetProductMetadata(
  metadata: unknown
): metadata is WidgetProductMetadata {
  return (
    typeof metadata === "object" &&
    metadata !== null &&
    "type" in metadata &&
    typeof (metadata as any).type === "string" &&
    metadata.type === WidgetType.PRODUCT
  );
}

export function isWidgetNewsletterMetadata(
  metadata: unknown
): metadata is WidgetNewsletterMetadata {
  return (
    typeof metadata === "object" &&
    metadata !== null &&
    "type" in metadata &&
    typeof (metadata as any).type === "string" &&
    metadata.type === WidgetType.NEWSLETTER
  );
}

export function isWidgetAuthorMetadata(
  metadata: unknown
): metadata is WidgetAuthorMetadata {
  return (
    typeof metadata === "object" &&
    metadata !== null &&
    "type" in metadata &&
    typeof (metadata as any).type === "string" &&
    metadata.type === WidgetType.AUTHOR
  );
}

export function isWidgetTagMetadata(
  metadata: unknown
): metadata is WidgetTagMetadata {
  return (
    typeof metadata === "object" &&
    metadata !== null &&
    "type" in metadata &&
    typeof (metadata as any).type === "string" &&
    metadata.type === WidgetType.TAG
  );
}
