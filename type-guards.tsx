import { ProductCategory, WidgetSection, WidgetType } from "@prisma/client";

import {
  AffiliateMetadata,
  EbookMetadata,
  EbookType,
  WidgetPostMetadata,
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
