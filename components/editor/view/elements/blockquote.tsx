import {
  Node,
  Replace,
  createElementNodeMatcher,
  createElementTransform,
} from "slate-to-react";

import { cn } from "@/lib/utils";

import { CustomText } from "@/components/editor";

type Blockquote = Replace<
  Node<"blockquote" | "block-quote">,
  {
    children: CustomText[];
  }
>;

export const isBlockquote = createElementNodeMatcher<Blockquote>(
  (node): node is Blockquote => node.type === "blockquote"
);

export const Blockquote = createElementTransform(
  isBlockquote,
  ({ key, element, attributes, children }) => (
    <blockquote
      key={key}
      className={cn(
        "mb-8 border-l-4 border-l-neutral-800 bg-white p-4 pl-8 shadow-md [&>p]:mb-0",
        element.align === "left" && "text-left",
        element.align === "center" && "text-center",
        element.align === "right" && "text-right"
      )}
    >
      {children}
    </blockquote>
  )
);
