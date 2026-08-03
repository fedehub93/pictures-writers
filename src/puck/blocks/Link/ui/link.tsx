"use client";

import { LinkProps } from "@/puck/fields/link";
import { Route } from "next";
import Link from "next/link";

export const LinkBlockUi = ({
  link,
  styleVars,
}: {
  link?: LinkProps;
  styleVars: Record<string, string>;
}) => {
  return (
    <div className="w-full">
      <Link
        href={(link?.href ?? "#") as Route}
        className="puck-dim puck-typo puck-deco inline-block"
        style={styleVars}
        prefetch={false}
      >
        {link?.label}
      </Link>
    </div>
  );
};
