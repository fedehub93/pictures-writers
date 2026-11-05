import type { CSSProperties } from "react";
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
 * block, so a footer column never shows a dead anchor.
 */
export const InlineSmartLink = ({
  link,
  className,
  style,
}: {
  link?: LinkProps | LegacyLinkProps;
  className?: string;
  style?: CSSProperties;
}) => {
  if (!link) return null;

  const href = getLinkHref(link);
  const label = link.label;

  if (!href && !label) return null;
  if (!href) {
    return (
      <span className={className} style={style}>
        {label}
      </span>
    );
  }

  const openInNewTab = getLinkOpenInNewTab(link);

  return (
    <Link
      href={href as Route}
      className={className}
      style={style}
      prefetch={false}
      target={openInNewTab ? "_blank" : undefined}
      rel={openInNewTab ? "noreferrer" : undefined}
    >
      {label ?? href}
    </Link>
  );
};
