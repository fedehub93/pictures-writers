import { renderToReactElement } from "@tiptap/static-renderer";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Youtube from "@tiptap/extension-youtube";
import Image from "@tiptap/extension-image";

import { TiptapContent } from "@/types";

import { InfoBoxNodeRenderer } from "./extensions/info-box";
import { InfoBoxRenderer } from "./extensions/info-box/ui/InfoBoxRenderer";
import { ProductNodeRenderer } from "./extensions/product";
import { ProductRenderer } from "./extensions/product/ui/ProductRenderer";
import { ImageRenderer } from "./extensions/image/ui/ImageRenderer";
import { LinkRenderer } from "./extensions/link/ui/LinkRenderer";
import { CustomLinkMarkRenderer } from "./extensions/link";

type Props = {
  content: TiptapContent[];
  preview?: boolean;
};

const TipTapRendererV2 = ({ content, preview = false }: Props) => {
  const output = renderToReactElement({
    content,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
        link: false,
        blockquote: {
          HTMLAttributes: {
            class: "not-prose",
          },
        },
      }),
      CustomLinkMarkRenderer,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Youtube.configure({
        nocookie: true,
      }),
      Image,
      ProductNodeRenderer,
      InfoBoxNodeRenderer,
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
      },
    },
  });

  return (
    <div className="prose md:prose-md lg:prose-lg max-w-full">{output}</div>
  );
};

export { TipTapRendererV2 };
