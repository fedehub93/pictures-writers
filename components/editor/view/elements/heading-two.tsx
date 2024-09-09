import {
  Node,
  Replace,
  createElementNodeMatcher,
  createElementTransform,
} from "slate-to-react";
import { cn } from "@/lib/utils";

import { CustomText } from "@/components/editor";

type HeadingTwo = Replace<
  Node<"heading-2">,
  {
    children: CustomText[];
  }
>;

export const isHeadingTwo = createElementNodeMatcher<HeadingTwo>(
  (node): node is HeadingTwo => node.type === "heading-2"
);

export const HeadingTwo = createElementTransform(
  isHeadingTwo,
  ({ key, element, attributes, children }) => (
    <h2
      key={key}
      className={cn(
        element.align === "left" && "text-left",
        element.align === "center" && "text-center",
        element.align === "right" && "text-right"
      )}
    >
      {children}
    </h2>
  )
);
