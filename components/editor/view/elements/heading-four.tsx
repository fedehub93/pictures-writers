import {
  Node,
  Replace,
  createElementNodeMatcher,
  createElementTransform,
} from "slate-to-react";
import { CustomText } from "@/components/editor";

type HeadingFour = Replace<
  Node<"heading-4">,
  {
    children: CustomText[];
  }
>;

export const isHeadingFour = createElementNodeMatcher<HeadingFour>(
  (node): node is HeadingFour => node.type === "heading-4"
);

export const HeadingFour = createElementTransform(
  isHeadingFour,
  ({ key, element, attributes, children }) => (
    <h4 className="text-lg mb-2" key={key}>
      {children}
    </h4>
  )
);
