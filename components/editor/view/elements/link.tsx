import NextLink from "next/link";

import { cn } from "@/lib/utils";
import { RenderNode } from "../helpers/render-node";
import { CustomElement } from "../slate-renderer";

interface LinkProps {
  node: CustomElement;
}

export const LinkElement = ({ node }: LinkProps) => {
  const isAnchor = node.data.uri.includes("#");
  const isExternalLink =
    node.data.uri.includes("http://") || node.data.uri.includes("https://");

  const isFollow =
    node.data.follow !== undefined
      ? node.data.follow
      : !isExternalLink
      ? true
      : false;

  return (
    <NextLink
      href={node.data.uri}
      className={cn("underline font-normal")}
      rel={`noopener noreferrer ${isFollow ? "follow" : "nofollow"}`}
      target={isExternalLink ? "_blank" : "_self"}
      prefetch={true}
    >
      {node.children.map((child: any, i: number) => (
        <RenderNode key={i} node={child} />
      ))}
    </NextLink>
  );
};
