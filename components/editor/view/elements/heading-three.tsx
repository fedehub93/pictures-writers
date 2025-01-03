import {
  Node,
  Replace,
  createElementNodeMatcher,
  createElementTransform,
} from "slate-to-react";
import { cn } from "@/lib/utils";

import { CustomText } from "@/components/editor";

type HeadingThree = Replace<
  Node<"heading-3">,
  {
    children: CustomText[];
  }
>;

export const isHeadingThree = createElementNodeMatcher<HeadingThree>(
  (node): node is HeadingThree => node.type === "heading-3"
);

export const HeadingThree = createElementTransform(
  isHeadingThree,
  ({ key, element, attributes, children }) => (
    <h3
      key={key}
      className={cn(
        element.align === "left" && "text-left",
        element.align === "center" && "text-center",
        element.align === "right" && "text-right"
      )}
    >
      {children}
    </h3>
  )
);
