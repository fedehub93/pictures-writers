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
      // <Button
      //   key={key}
      //   className="flex items-center justify-center mx-auto button-base bg-green-600 hover:bg-green-600 my-4 font-bold"
      // >
      <div className="flex items-center justify-center mx-auto w-full button-base">
        <NextLink
          href={element.data.uri}
          rel="noopener noreferrer nofollow"
          target={"_blank"}
          className=" px-4 py-2 text-white rounded-sm button-base bg-green-600 hover:bg-green-600 my-4 font-bold"
        >
          {element.data.label}
          {children}
        </NextLink>
      </div>
      // </Button>
    );
  }
);
