import {
  Node,
  Replace,
  createElementNodeMatcher,
  createElementTransform,
} from "slate-to-react";
import { cn } from "@/lib/utils";

import { CustomText } from "@/components/editor";

type HeadingOne = Replace<
  Node<"heading-one">,
  {
    children: CustomText[];
  }
>;

export const isHeadingOne = createElementNodeMatcher<HeadingOne>(
  (node): node is HeadingOne => node.type === "heading-one"
);

export const HeadingOne = createElementTransform(
  isHeadingOne,
  ({ key, element, attributes, children }) => (
    <h1
      key={key}
      className={cn(
        element.align === "left" && "text-left",
        element.align === "center" && "text-center",
        element.align === "right" && "text-right"
      )}
    >
      {children}
    </h1>
  )
);
