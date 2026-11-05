import type { CSSProperties, ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";

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
 * provided it replaces the link label, letting blocks such as AnnouncementBar
 * reuse the anchor/plain-text behaviour for their own content.
 */
export const InlineSmartLink = ({
  link,
  className,
  style,
  children,
  onClick,
}: {
  link?: LinkProps | LegacyLinkProps;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  onClick?: () => void;
}) => {
  if (!link) return null;

  const href = getLinkHref(link);
  const content = children ?? link.label ?? href;

  if (!content) return null;
  if (!href) {
    return (
      <span className={className} style={style} onClick={onClick}>
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
    >
      {content}
    </Link>
  );
};
