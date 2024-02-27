import {
  Node,
  Replace,
  createElementNodeMatcher,
  createElementTransform,
} from "slate-to-react";
import { CustomText } from "@/components/editor";

type Link = Replace<
  Node<"link">,
  {
    url: string;
    children: CustomText[];
  }
>;

export const isLink = createElementNodeMatcher<Link>(
  (node): node is Link => node.type === "link" && typeof node.url === "string"
);

export const Link = createElementTransform(
  isLink,
  ({ key, element, attributes, children }) => (
    <a href={element.url} rel="noopener noreferrer" target="_blank" key={key}>
      {children}
    </a>
  )
);
