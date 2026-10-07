import { ProductType } from "@/generated/prisma";

import { EbookType } from "@/types";

/**
 * Starting metadata for a freshly created product, matching the shape the
 * type-specific forms expect. Kept server-side so `create` never trusts a
 * client-supplied metadata blob.
 */
export const getDefaultProductMetadata = (
  type: ProductType,
): PrismaJson.ProductMetadata => {
  switch (type) {
    case ProductType.EBOOK:
      return {
        type: ProductType.EBOOK,
        edition: "",
        formats: [
          { type: EbookType.PDF, url: "", size: 0, pages: 0 },
          { type: EbookType.EPUB, url: "", size: 0, pages: 0 },
          { type: EbookType.MOBI, url: "", size: 0, pages: 0 },
        ],
        publishedAt: null,
        author: null,
      };
    case ProductType.AFFILIATE:
      return {
        type: ProductType.AFFILIATE,
        url: "",
      };
    case ProductType.WEBINAR:
      return {
        type: ProductType.WEBINAR,
        lessons: [],
        seats: 0,
        platform: "",
        isOpen: false,
      };
    case ProductType.SERVICE:
      return {
        type: ProductType.SERVICE,
        serviceType: "",
        competitorPrice: 0,
        target: "",
        attachamentUrl: "",
        features: [],
      };
    default:
      return undefined;
  }
};
