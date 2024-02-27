import {
  Node,
  Replace,
  createElementNodeMatcher,
  createElementTransform,
} from "slate-to-react";
import { CustomText } from "@/components/editor";

type HeadingFour = Replace<
  Node<"heading-four">,
  {
    children: CustomText[];
  }
>;

export const isHeadingFour = createElementNodeMatcher<HeadingFour>(
  (node): node is HeadingFour => node.type === "heading-four"
);

export const HeadingFour = createElementTransform(
  isHeadingFour,
  ({ key, element, attributes, children }) => (
    <h1 className="text-lg mb-2" key={key}>
      {children}
    </h1>
  )
);
