import {
  Node,
  Replace,
  createElementNodeMatcher,
  createElementTransform,
} from "slate-to-react";
import { CustomText } from "@/components/editor";
import { cn } from "@/lib/utils";
import NextLink from "next/link";

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
    const isExternalLink = element.data.uri.includes('http://') || element.data.uri.includes('https://');


    return (
      <NextLink
        href={element.data.uri}
        className={cn("underline font-bold")}
        rel="noopener noreferrer nofollow"
        target={isExternalLink ? "_blank" : "_self"}
        key={key}
      >
        {children}
      </NextLink>
    );
  }
);
