"use client";

import { ProductType } from "@/generated/prisma";

import {
  isAffiliateMetadata,
  isEbookMetadata,
  isServiceMetadata,
  isWebinarMetadata,
} from "../../../../types";

import { ProductAffiliateMetadataForm } from "./affiliate/product-affiliate-metadata-form";
import { ProductEbookMetadataForm } from "./ebook/product-ebook-metadata-form";
import { ProductServiceMetadataForm } from "./service/product-service-metadata-form";
import { ProductWebinarMetadataForm } from "./webinar/product-webinar-metadata-form";

interface ProductMetadataFormProps {
  id: string;
  rootId: string;
  type: ProductType;
  metadata: unknown;
}

export const ProductMetadataForm = ({
  id,
  rootId,
  type,
  metadata,
}: ProductMetadataFormProps) => {
  switch (type) {
    case ProductType.EBOOK:
      return (
        <ProductEbookMetadataForm
          id={id}
          rootId={rootId}
          initialData={isEbookMetadata(metadata) ? metadata : undefined}
        />
      );
    case ProductType.AFFILIATE:
      return (
        <ProductAffiliateMetadataForm
          id={id}
          rootId={rootId}
          initialData={isAffiliateMetadata(metadata) ? metadata : undefined}
        />
      );
    case ProductType.SERVICE:
      return (
        <ProductServiceMetadataForm
          id={id}
          rootId={rootId}
          initialData={isServiceMetadata(metadata) ? metadata : undefined}
        />
      );
    case ProductType.WEBINAR:
      return (
        <ProductWebinarMetadataForm
          id={id}
          rootId={rootId}
          initialData={isWebinarMetadata(metadata) ? metadata : undefined}
        />
      );
    default:
      return null;
  }
};
