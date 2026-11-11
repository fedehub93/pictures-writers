import type { CSSProperties, ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";

import type { BlockDragRef } from "@/puck/types";

import {
  getLinkHref,
  getLinkOpenInNewTab,
  type LegacyLinkProps,
  type LinkProps,
} from "../types";

/**
 * Renders a single resolved link inline (no wrapper element).
 *
 * Broken or unresolved entity links render as plain text, matching the Link
 * block, so a footer column never shows a dead anchor. When `children` is
 * provided it replaces the link label, letting blocks that render their own
 * copy reuse the anchor/plain-text behaviour.
 *
 * `dragRef` is the editor's block-root ref: a block that renders this component
 * *is* the anchor (or the plain-text span), so the ref has to reach whichever
 * element is rendered rather than landing on a wrapper around it.
 */
export const InlineSmartLink = ({
  link,
  className,
  style,
  children,
  onClick,
  dragRef,
}: {
  link?: LinkProps | LegacyLinkProps;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  onClick?: () => void;
  /** Editor-only: Puck's selection ref, attached to the rendered element. */
  dragRef?: BlockDragRef;
}) => {
  if (!link) return null;

  const href = getLinkHref(link);
  const content = children ?? link.label ?? href;

  if (!content) return null;
  if (!href) {
    return (
      <span className={className} style={style} onClick={onClick} ref={dragRef}>
        {content}
      </span>
    );
  }

  const openInNewTab = getLinkOpenInNewTab(link);

  return (
    <Link
      href={href as Route}
      className={className}
      style={style}
      onClick={onClick}
      prefetch={false}
      target={openInNewTab ? "_blank" : undefined}
      rel={openInNewTab ? "noreferrer" : undefined}
      ref={dragRef}
    >
      {content}
    </Link>
  );
};
