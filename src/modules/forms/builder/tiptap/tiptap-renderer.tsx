import { renderToReactElement } from "@tiptap/static-renderer";
import StarterKit from "@tiptap/starter-kit";

import { TiptapContent } from "@/types";

import { LinkRenderer } from "@/shared/components/tiptap-renderer/extensions/link/ui/link-renderer";
import { CustomLinkMarkRenderer } from "@/shared/components/tiptap-renderer/extensions/link";

type Props = {
  content: TiptapContent;
  preview?: boolean;
};

const TipTapRenderer = ({ content }: Props) => {
  if (!content || typeof content === "string") return content;

  const output = renderToReactElement({
    content,
    extensions: [
      StarterKit.configure({
        link: false,
      }),
      CustomLinkMarkRenderer,
    ],
    options: {
      markMapping: {
        link: ({ children, mark }) => {
          return <LinkRenderer mark={mark}>{children}</LinkRenderer>;
        },
      },
    },
  });

  return <div className="max-w-full">{output}</div>;
};

export { TipTapRenderer };
