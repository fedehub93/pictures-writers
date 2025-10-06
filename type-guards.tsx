import { ProductType, WidgetType } from "@prisma/client";

import {
  AffiliateMetadata,
  EbookMetadata,
  EbookType,
  WidgetAuthorMetadata,
  WidgetCategoryMetadata,
  WidgetNewsletterMetadata,
  WidgetProductPopMetadata,
  WidgetPostMetadata,
  WidgetProductMetadata,
  WidgetSearchMetadata,
  WidgetSocialMetadata,
  WidgetTagMetadata,
  WebinarMetadata,
  TiptapContent,
} from "@/types";
import { JSONContent } from "@tiptap/react";

export function isValidEbookFormat(format: string | null): format is EbookType {
  return format === "pdf" || format === "epub" || format === "mobi";
}

export function isEbookMetadata(metadata: unknown): metadata is EbookMetadata {
  return (
    typeof metadata === "object" &&
    metadata !== null &&
    "type" in metadata &&
    typeof (metadata as any).type === "string" &&
    metadata.type === ProductType.EBOOK
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
    metadata.type === ProductType.AFFILIATE
  );
}

export function isWebinarMetadata(
  metadata: unknown
): metadata is WebinarMetadata {
  return (
    typeof metadata === "object" &&
    metadata !== null &&
    "type" in metadata &&
    typeof (metadata as any).type === "string" &&
    metadata.type === ProductType.WEBINAR
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

export function isWidgetSocialMetadata(
  metadata: unknown
): metadata is WidgetSocialMetadata {
  return (
    typeof metadata === "object" &&
    metadata !== null &&
    "type" in metadata &&
    typeof (metadata as any).type === "string" &&
    metadata.type === WidgetType.SOCIAL
  );
}

export function isWidgetProductPopMetadata(
  metadata: unknown
): metadata is WidgetProductPopMetadata {
  return (
    typeof metadata === "object" &&
    metadata !== null &&
    "type" in metadata &&
    typeof (metadata as any).type === "string" &&
    metadata.type === WidgetType.PRODUCT_POP
  );
}

export function isJSONContent(
  content: TiptapContent
): content is JSONContent {
  return typeof content === "object" 
    && content !== null
    && !Array.isArray(content)
    && ("type" in content || "text" in content)
}