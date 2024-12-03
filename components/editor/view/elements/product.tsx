import {
  Node,
  Replace,
  createElementNodeMatcher,
  createElementTransform,
} from "slate-to-react";
import NextLink from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import { AffiliateMetadata, EbookMetadata } from "@/types";

import { CustomText } from "@/components/editor";
import { isAffiliateMetadata, isEbookMetadata } from "@/type-guards";

type Product = Replace<
  Node<"product">,
  {
    data: {
      title: string;
      type: string;
      slug: string;
      imageCoverUrl: string;
      price: number | null;
      metadata?: AffiliateMetadata | EbookMetadata;
    };
    children: CustomText[];
  }
>;

export const isProduct = createElementNodeMatcher<Product>(
  (node): node is Product =>
    node.type === "product" &&
    typeof node.data.title === "string" &&
    typeof node.data.type === "string" &&
    typeof node.data.slug === "string" &&
    typeof node.data.imageCoverUrl === "string" &&
    typeof node.data.price === "number" &&
    typeof node.data.metadata === "object"
);

export const ProductElement = createElementTransform(
  isProduct,
  ({ key, element, attributes, children }) => {
    if (isEbookMetadata(element.data.metadata)) {
      return (
        <div
          key={key}
          className="flex flex-col items-center justify-center mx-auto w-full md:w-5/12 border my-8 rounded-lg shadow-lg bg-white"
        >
          <div className="relative w-full aspect-square border-b">
            <Image
              src={element.data.imageCoverUrl}
              alt={element.data.title}
              fill
              className="object-contain"
            />
          </div>
          <div className="p-4 flex flex-col gap-y-2 text-center">
            <div className="font-medium text-lg leading-5">
              {element.data.title}
            </div>
            <div className="text-xs text-muted-foreground">
              di {element.data.metadata.author?.firstName}{" "}
              {element.data.metadata.author?.lastName}
            </div>
            <div>
              <Button asChild>
                <NextLink
                  href={`/ebooks/${element.data.slug}`}
                  rel="noopener noreferrer nofollow"
                  target={"_blank"}
                >
                  Vai all&apos;ebook
                  {children}
                </NextLink>
              </Button>
            </div>
          </div>
        </div>
      );
    }
    if (isAffiliateMetadata(element.data.metadata)) {
      return (
        <div
          key={key}
          className="flex flex-col items-center justify-center mx-auto w-full md:w-5/12 border my-8 rounded-lg shadow-lg bg-white"
        >
          <div className="relative w-full aspect-square border-b">
            <Image
              src={element.data.imageCoverUrl}
              alt={element.data.title}
              fill
              className="object-contain"
            />
          </div>
          <div className="p-4 flex flex-col gap-y-4 text-center">
            <div className="font-medium text-lg leading-5">
              {element.data.title}
            </div>
            <Button asChild>
              <NextLink
                href={element.data.metadata.url}
                rel="noopener noreferrer nofollow"
                target={"_blank"}
              >
                Acquista su amazon
                {children}
              </NextLink>
            </Button>
          </div>
        </div>
      );
    }

    return <div></div>;
  }
);
