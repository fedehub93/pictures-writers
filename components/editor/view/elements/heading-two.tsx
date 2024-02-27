import {
  Node,
  Replace,
  createElementNodeMatcher,
  createElementTransform,
} from "slate-to-react";
import { CustomText } from "@/components/editor";

type HeadingTwo = Replace<
  Node<"heading-two">,
  {
    children: CustomText[];
  }
>;

export const isHeadingTwo = createElementNodeMatcher<HeadingTwo>(
  (node): node is HeadingTwo => node.type === "heading-two"
);

export const HeadingTwo = createElementTransform(
  isHeadingTwo,
  ({ key, element, attributes, children }) => (
    <h1 className="text-2xl mb-2" key={key}>
      {children}
    </h1>
  )
);
