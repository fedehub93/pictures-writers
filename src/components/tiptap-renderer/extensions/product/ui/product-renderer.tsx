import NextLink from "next/link";
import Image from "next/image";
import { Node } from "@tiptap/pm/model";

import { Button } from "@/components/ui/button";

import { isAffiliateMetadata, isEbookMetadata } from "@/type-guards";
import { getPublishedProductByRootId } from "@/data/product";

interface ProductRendererProps {
  node: Node;
}

export const ProductRenderer = async ({ node }: ProductRendererProps) => {
  const product = await getPublishedProductByRootId(node.attrs.productRootId);

  if (!product) return null;

  if (isEbookMetadata(product.metadata)) {
    return (
      <div className="flex flex-col items-center justify-center mx-auto w-full md:w-5/12 border my-8 rounded-lg shadow-lg bg-white">
        <div
          className="relative w-full aspect-square border-b"
          contentEditable={false}
        >
          {product.imageCover && (
            <Image
              src={product.imageCover?.url}
              alt={product.imageCover?.altText || "product-image"}
              fill
              sizes="(max-width: 1280px) 90vw, 35vw"
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
      </div>
    );
  }
  if (isAffiliateMetadata(product?.metadata)) {
    return (
      <div
        draggable={true}
        contentEditable={false}
        className="flex flex-col items-center justify-center mx-auto w-full md:w-5/12 border my-8 rounded-lg shadow-lg bg-white"
      >
        <div className="relative w-full aspect-square border-b">
          {product.imageCover && (
            <Image
              draggable={false}
              contentEditable={false}
              src={product.imageCover?.url}
              alt={product.imageCover?.altText || "product-image"}
              fill
              sizes="(max-width: 1280px) 90vw, 35vw"
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
      </div>
    );
  }

  return <div contentEditable={false}></div>;
};
