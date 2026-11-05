"use client";

import {
  getLinkHref,
  getLinkOpenInNewTab,
  type LegacyLinkProps,
  type LinkProps,
} from "@/puck/fields/link/types";
import { Route } from "next";
import Link from "next/link";

export const LinkBlockUi = ({
  link,
  styleVars,
}: {
  link?: LinkProps | LegacyLinkProps;
  styleVars: Record<string, string>;
}) => {
  const href = getLinkHref(link);
  const label = link?.label;
  const openInNewTab = getLinkOpenInNewTab(link);
  const className = "puck-dim puck-typo puck-deco inline-block";

  return (
    <div className="w-full">
      {href ? (
        <Link
          href={href as Route}
          className={className}
          style={styleVars}
          prefetch={false}
          target={openInNewTab ? "_blank" : undefined}
          rel={openInNewTab ? "noreferrer" : undefined}
        >
          {label}
        </Link>
      ) : (
        <span className={className} style={styleVars}>
          {label}
        </span>
      )}
    </div>
  );
};
