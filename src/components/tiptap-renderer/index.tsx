import NextImage from "next/image";
import Link from "next/link";

import { renderToReactElement } from "@tiptap/static-renderer";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Youtube from "@tiptap/extension-youtube";
import Image from "@tiptap/extension-image";

import { TiptapContent } from "@/types";

import { InfoBoxNodeRenderer } from "./extensions/info-box";
import { ProductNodeRenderer } from "./extensions/product";
import { CustomLinkMarkRenderer } from "./extensions/link";
import { AdBlockNodeRenderer } from "./extensions/ads";
import { TableContentNodeRenderer } from "./extensions/table-content";
import { TableContentRenderer } from "./extensions/table-content/ui/table-content-renderer";
import { CustomHeading } from "./extensions/heading";

import { InfoBoxRenderer } from "./extensions/info-box/ui/info-box-renderer";
import { ProductRenderer } from "./extensions/product/ui/product-renderer";
import { ImageRenderer } from "./extensions/image/ui/image-renderer";
import { LinkRenderer } from "./extensions/link/ui/link-renderer";
import { AdItemRenderer } from "./extensions/ads/ui/ad-item-renderer";

type Props = {
  content: TiptapContent;
  preview?: boolean;
};

const TipTapRendererV2 = ({ content, preview = false }: Props) => {
  if (!content || typeof content === "string") return content;

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
            <AdItemRenderer
              imageSrc={node.attrs.src}
              title={node.attrs.title}
              description={node.attrs.description}
              href={node.attrs.url}
            />
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
