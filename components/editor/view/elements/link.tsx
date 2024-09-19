import {
  Node,
  Replace,
  createElementNodeMatcher,
  createElementTransform,
} from "slate-to-react";
import { CustomText } from "@/components/editor";
import { cn } from "@/lib/utils";
import NextLink from "next/link"

type Link = Replace<
  Node<"hyperlink">,
  {
    data: { uri: string };
    children: CustomText[];
  }
>;

export const isLink = createElementNodeMatcher<Link>(
  (node): node is Link =>
    node.type === "hyperlink" && typeof node.data.uri === "string"
);

export const Link = createElementTransform(
  isLink,
  ({ key, element, attributes, children }) => {
    const isAnchor = element.data.uri.includes("#");

    return (
      <NextLink
        href={element.data.uri}
        className={cn("underline")}
        rel="noopener noreferrer nofollow"
        target={isAnchor ? "_self" : "_blank"}
        key={key}
      >
        {children}
      </NextLink>
    );
  }
);
