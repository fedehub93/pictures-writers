import NextImage from "next/image";
import Link from "next/link";

import { renderToReactElement } from "@tiptap/static-renderer";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Youtube from "@tiptap/extension-youtube";
import Image from "@tiptap/extension-image";

import { TiptapContent } from "@/types";
import { Button } from "@/components/ui/button";

import { InfoBoxNodeRenderer } from "./extensions/info-box";
import { InfoBoxRenderer } from "./extensions/info-box/ui/InfoBoxRenderer";
import { ProductNodeRenderer } from "./extensions/product";
import { ProductRenderer } from "./extensions/product/ui/ProductRenderer";
import { ImageRenderer } from "./extensions/image/ui/ImageRenderer";
import { LinkRenderer } from "./extensions/link/ui/LinkRenderer";
import { CustomLinkMarkRenderer } from "./extensions/link";
import { AdBlockNodeRenderer } from "./extensions/ads";
import { TableContentNodeRenderer } from "./extensions/table-content";
import { TableContentRenderer } from "./extensions/table-content/ui/table-content-renderer";
import { CustomHeading } from "./extensions/heading";
import { Route } from "next";

type Props = {
  content: TiptapContent[];
  preview?: boolean;
};

const TipTapRendererV2 = ({ content, preview = false }: Props) => {
  const output = renderToReactElement({
    content,
    extensions: [
      StarterKit.configure({
        heading: false,
        link: false,
        blockquote: {
          HTMLAttributes: {
            class: "not-prose",
          },
        },
      }),
      CustomHeading.configure({
        levels: [1, 2, 3, 4],
      }),
      CustomLinkMarkRenderer,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Youtube.configure({
        nocookie: true,
      }),
      Image,
      ProductNodeRenderer,
      InfoBoxNodeRenderer,
      AdBlockNodeRenderer,
      TableContentNodeRenderer,
    ],
    options: {
      markMapping: {
        link: ({ children, mark }) => {
          return <LinkRenderer mark={mark}>{children}</LinkRenderer>;
        },
      },
      nodeMapping: {
        infobox: ({ node, children }) => {
          return <InfoBoxRenderer node={node}>{children}</InfoBoxRenderer>;
        },
        tablecontent: ({ node, children }) => {
          return (
            <TableContentRenderer node={node}>{children}</TableContentRenderer>
          );
        },
        product: ({ node }) => {
          return <ProductRenderer node={node} />;
        },
        image: ({ node }) => {
          return <ImageRenderer node={node} />;
        },
        youtube: ({ node }) => {
          return (
            <iframe
              src={node.attrs.src}
              allowFullScreen
              className="h-full w-full aspect-video"
            />
          );
        },
        adBlock: ({ node }) => {
          return (
            <div className="border rounded-md bg-primary-foreground flex flex-col overflow-hidden w-5/8 mx-auto items-center shadow-lg">
              <NextImage
                src={node.attrs.src}
                alt="Ads Box"
                width={1000}
                height={1000}
                className="object-cover"
              />
              <div className="p-4 flex flex-col gap-y-4">
                <div className="text-2xl text-primary font-semibold leading-8 text-center">
                  {node.attrs.title}
                </div>
                <div className="text-base font-semibold text-center">
                  {node.attrs.description}
                </div>
                <Button asChild>
                  <Link href={`${node.attrs.url}` as Route}>Scopri di più</Link>
                </Button>
              </div>
            </div>
          );
        },
      },
    },
  });

  return (
    <div className="prose md:prose-md lg:prose-lg max-w-full">{output}</div>
  );
};

export { TipTapRendererV2 };
