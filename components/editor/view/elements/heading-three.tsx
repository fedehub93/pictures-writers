import {
  Node,
  Replace,
  createElementNodeMatcher,
  createElementTransform,
} from "slate-to-react";
import { CustomText } from "@/components/editor";

type HeadingThree = Replace<
  Node<"heading-three">,
  {
    children: CustomText[];
  }
>;

export const isHeadingThree = createElementNodeMatcher<HeadingThree>(
  (node): node is HeadingThree => node.type === "heading-three"
);

export const HeadingThree = createElementTransform(
  isHeadingThree,
  ({ key, element, attributes, children }) => (
    <h1 className="text-xl mb-2" key={key}>
      {children}
    </h1>
  )
);
