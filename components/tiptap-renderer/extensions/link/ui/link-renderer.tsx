import NextLink from "next/link";

import { Mark, Node } from "@tiptap/pm/model";

import { cn } from "@/lib/utils";

interface LinkProps {
  mark: Mark;
  children: React.ReactNode;
}

export const LinkRenderer = ({ mark, children }: LinkProps) => {
  const isAnchor = mark.attrs.href.includes("#");

  const isExternalLink =
    mark.attrs.href.includes("http://") || mark.attrs.href.includes("https://");

  const isFollow = isExternalLink
    ? mark.attrs.nofollow !== undefined
      ? !!!mark.attrs.nofollow
      : false
    : true;

  let rel = "noopener noreferrer";
  if (!isFollow) {
    rel = "noopener noreferrer nofollow";
  }

  let target = isExternalLink ? "_blank" : undefined;

  return (
    <NextLink
      href={mark.attrs.href}
      rel={rel}
      target={target}
      prefetch
    >
      {children}
    </NextLink>
  );
};
