import NextLink from "next/link";
import Image from "next/image";

import { isAffiliateMetadata, isEbookMetadata } from "@/type-guards";
import { Button } from "@/components/ui/button";
import { RenderNode } from "../helpers/render-node";
import { CustomElement } from "../slate-renderer";

interface ImageElementProps {
  node: CustomElement;
}

export const ProductElement = ({ node }: ImageElementProps) => {
  if (isEbookMetadata(node.data.metadata)) {
    return (
      <div className="flex flex-col items-center justify-center mx-auto w-full md:w-5/12 border my-8 rounded-lg shadow-lg bg-white">
        <div className="relative w-full aspect-square border-b">
          <Image
            src={node.data.imageCoverUrl}
            alt={node.data.title}
            fill
            className="object-contain"
          />
        </div>
        <div className="p-4 flex flex-col gap-y-2 text-center">
          <div className="font-medium text-lg leading-5">{node.data.title}</div>
          <div className="text-xs text-muted-foreground">
            di {node.data.metadata.author?.firstName}{" "}
            {node.data.metadata.author?.lastName}
          </div>
          <div>
            <Button asChild>
              <NextLink
                href={`/shop/ebooks/${node.data.slug as string}`}
                rel="noopener noreferrer nofollow"
                target={"_blank"}
              >
                Vai all&apos;ebook
                {node.children.map((child: any, i: number) => (
                  <RenderNode key={i} node={child} />
                ))}
              </NextLink>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  if (isAffiliateMetadata(node.data.metadata)) {
    return (
      <div className="flex flex-col items-center justify-center mx-auto w-full md:w-5/12 border my-8 rounded-lg shadow-lg bg-white">
        <div className="relative w-full aspect-square border-b">
          <Image
            src={node.data.imageCoverUrl}
            alt={node.data.title}
            fill
            className="object-contain"
          />
        </div>
        <div className="p-4 flex flex-col gap-y-4 text-center">
          <div className="font-medium text-lg leading-5">{node.data.title}</div>
          <Button asChild>
            <a
              href={node.data.metadata.url as string}
              rel="noopener noreferrer nofollow"
              target={"_blank"}
            >
              Acquista su amazon
              {node.children.map((child: any, i: number) => (
                <RenderNode key={i} node={child} />
              ))}
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return <div></div>;
};
