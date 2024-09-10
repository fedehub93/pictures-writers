import {
  Node,
  Replace,
  createElementNodeMatcher,
  createElementTransform,
} from "slate-to-react";

import { CustomText } from "@/components/editor";

type NumberedList = Replace<
  Node<"ordered-list">,
  {
    children: CustomText[];
  }
>;

export const isNumbered = createElementNodeMatcher<NumberedList>(
  (node): node is NumberedList => node.type === "ordered-list"
);

export const NumberedList = createElementTransform(
  isNumbered,
  ({ key, element, attributes, children }) => (
    <ol key={key} className="list-disc px-4 mb-4">
      {children}
    </ol>
  )
);
