import {
  Node,
  Replace,
  createElementNodeMatcher,
  createElementTransform,
} from "slate-to-react";

import { CustomText } from "@/components/editor";

type ListItem = Replace<
  Node<"list-item">,
  {
    children: CustomText[];
  }
>;

export const isListItem = createElementNodeMatcher<ListItem>(
  (node): node is ListItem => node.type === "list-item"
);

export const ListItem = createElementTransform(
  isListItem,
  ({ key, element, attributes, children }) => (
    <li key={key} className="list-item mb-2 text-base">
      {children}
    </li>
  )
);
