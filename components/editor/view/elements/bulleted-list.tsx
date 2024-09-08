import {
  Node,
  Replace,
  createElementNodeMatcher,
  createElementTransform,
} from "slate-to-react";

import { CustomText } from "@/components/editor";

type BulletedList = Replace<
  Node<"unordered-list">,
  {
    children: CustomText[];
  }
>;

export const isBulletedList = createElementNodeMatcher<BulletedList>(
  (node): node is BulletedList => node.type === "unordered-list"
);

export const BulletedList = createElementTransform(
  isBulletedList,
  ({ key, element, attributes, children }) => (
    <ul key={key} className="list-disc px-4 mb-4">
      {children}
    </ul>
  )
);
