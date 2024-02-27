import {
  Node,
  Replace,
  createElementNodeMatcher,
  createElementTransform,
} from "slate-to-react";
import { CustomText } from "@/components/editor";

type Paragraph = Replace<
  Node<"paragraph">,
  {
    children: CustomText[];
  }
>;

export const isParagraph = createElementNodeMatcher<Paragraph>(
  (node): node is Paragraph => node.type === "paragraph"
);

export const Paragraph = createElementTransform(
  isParagraph,
  ({ key, element, attributes, children }) => <p key={key}>{children}</p>
);
