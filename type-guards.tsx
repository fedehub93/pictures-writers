import { ProductCategory } from "@prisma/client";

import { AffiliateMetadata, EbookMetadata, EbookType } from "@/types";

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
