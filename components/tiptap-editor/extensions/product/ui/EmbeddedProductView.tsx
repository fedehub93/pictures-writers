import NextLink from "next/link";
import Image from "next/image";

import { NodeViewRendererProps, NodeViewWrapper } from "@tiptap/react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { isAffiliateMetadata, isEbookMetadata } from "@/type-guards";
import { useProductRootIdQuery } from "@/app/(admin)/_hooks/use-product-root-id-query";

export const EmbeddedProductView = ({ node }: NodeViewRendererProps) => {
  const {
    data: product,
    isLoading,
    isError,
  } = useProductRootIdQuery({ rootId: node.attrs.productRootId });

  if (!product || isLoading) {
    return (
      <NodeViewWrapper className="flex flex-col items-center justify-center mx-auto w-full md:w-5/12 border my-8 rounded-lg shadow-lg bg-white">
        <div
          className="relative w-full size-72 aspect-square border-b flex justify-center"
          contentEditable={false}
        >
          <Skeleton className="size-full" />
        </div>
        <div className="p-4 flex flex-col w-full h-20">
          <Skeleton className="w-full h-20" />
        </div>
      </NodeViewWrapper>
    );
  }

  if (isEbookMetadata(product.metadata)) {
    return (
      <NodeViewWrapper className="flex flex-col items-center justify-center mx-auto w-full md:w-5/12 border my-8 rounded-lg shadow-lg bg-white">
        <div
          className="relative w-full aspect-square border-b"
          contentEditable={false}
        >
          {product.imageCover && (
            <Image
              src={product.imageCover?.url}
              alt={product.imageCover.altText || "product-image"}
              fill
              className="object-contain"
            />
          )}
        </div>
        <div className="p-4 flex flex-col gap-y-2 text-center">
          <div className="font-medium text-lg leading-5">{product.title}</div>
          <div className="text-xs text-muted-foreground">
            di {product.metadata.author?.firstName}{" "}
            {product.metadata.author?.lastName}
          </div>
          <div>
            <Button asChild>
              <NextLink
                href={`/shop/ebooks/${product.slug as string}`}
                rel="noopener noreferrer nofollow"
                target={"_blank"}
              >
                Vai all&apos;ebook
              </NextLink>
            </Button>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }
  if (isAffiliateMetadata(product.metadata)) {
    return (
      <NodeViewWrapper
        draggable={true}
        contentEditable={false}
        className="flex flex-col items-center justify-center mx-auto w-full md:w-5/12 border my-8 rounded-lg shadow-lg bg-white"
      >
        <div className="relative w-full aspect-square border-b">
          {product.imageCover && (
            <Image
              draggable={false}
              contentEditable={false}
              src={product.imageCover.url}
              alt={product.imageCover.altText || ""}
              fill
              className="object-contain"
            />
          )}
        </div>
        <div className="p-4 flex flex-col gap-y-4 text-center">
          <div className="font-medium text-lg leading-5">{product.title}</div>
          <Button asChild>
            <a
              draggable={false}
              contentEditable={false}
              href={product.metadata.url as string}
              rel="noopener noreferrer nofollow"
              target={"_blank"}
            >
              Acquista su amazon
            </a>
          </Button>
        </div>
      </NodeViewWrapper>
    );
  }

  return <NodeViewWrapper contentEditable={false}></NodeViewWrapper>;
};
