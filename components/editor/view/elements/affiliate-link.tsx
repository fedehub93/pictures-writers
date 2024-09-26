import {
  Node,
  Replace,
  createElementNodeMatcher,
  createElementTransform,
} from "slate-to-react";
import { CustomText } from "@/components/editor";
import { cn } from "@/lib/utils";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";

type Link = Replace<
  Node<"affiliate-link">,
  {
    data: { uri: string; label: string };
    children: CustomText[];
  }
>;

export const isAffiliateLink = createElementNodeMatcher<Link>(
  (node): node is Link =>
    node.type === "affiliate-link" &&
    typeof node.data.uri === "string" &&
    typeof node.data.label === "string"
);

export const AffiliateLink = createElementTransform(
  isAffiliateLink,
  ({ key, element, attributes, children }) => {
    return (
      <Button className="flex items-center justify-center mx-auto max-w-md button-base bg-green-600 hover:bg-green-600 my-4 font-bold">
        <NextLink
          href={element.data.uri}
          
          rel="noopener noreferrer nofollow"
          target={"_blank"}
          key={key}
        >
          {element.data.label}
          {children}
        </NextLink>
      </Button>
    );
  }
);
