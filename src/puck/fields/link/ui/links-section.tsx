"use client";
import "client-only";

import { PropHeader } from "@/puck/components/prop-header";

import type { LinkListItem } from "../types";
import { LinksEditor } from "./links-editor";

/**
 * The "Links" control shared by the footer blocks.
 *
 * Keeping the property header and the inline editor together means Link list
 * and Copyright expose the same label, reset affordance and row behaviour
 * inside their own content accordion.
 */
export const LinksSection = ({
  links,
  isModified,
  onReset,
  onChange,
}: {
  links?: LinkListItem[];
  isModified: boolean;
  onReset: () => void;
  onChange: (links: LinkListItem[]) => void;
}) => (
  <div className="flex flex-col gap-y-1">
    <PropHeader
      name="links"
      label="Links"
      isModified={isModified}
      onReset={onReset}
    />
    <LinksEditor links={links} onChange={onChange} />
  </div>
);
