import type { ReactNode } from "react";

import type { PuckContext } from "@puckeditor/core";

import { getDimensionVars } from "@/puck/utils/get-style-vars";

import type { RootProps } from "./types";
import { RootBlockUi } from "./ui/root";

/**
 * Design tokens the public site defines in `home.css` and the admin shell
 * defines differently. The canvas must measure like the published page, so the
 * preview root overrides them in editing mode only. Spacing and radius are the
 * two that change `calc(var(--spacing) * n)` utilities and `rounded-*`.
 *
 * The page editor Site layout preview applies the same map so the Header and
 * Footer regions, which sit outside the page root wrapper, measure like the
 * page.
 */
export const CANVAS_TOKENS: Record<string, string> = {
  "--spacing": "0.25rem",
  "--radius": "0.5rem",
  fontFamily: "var(--font-canvas)",
};

/**
 * The page content wrapper shared by the public page root and the page editor
 * root, so both draw exactly the same markup around the page blocks.
 */
export const PageRootContent = ({
  children,
  dimension,
  isEditing,
}: {
  children: ReactNode;
  dimension?: RootProps["dimension"];
  isEditing?: boolean;
}) => {
  const styleVars = {
    ...getDimensionVars(dimension),
    ...(isEditing ? CANVAS_TOKENS : {}),
  };

  return <RootBlockUi styleVars={styleVars}>{children}</RootBlockUi>;
};

/**
 * Pure render shared by the editor canvas and the public page root.
 *
 * It deliberately imports only the root UI and the shared style-variable
 * utilities so the public render path never pulls in editor field modules.
 */
export const renderRoot = ({
  children,
  dimension,
  puck,
}: RootProps & { puck?: PuckContext }) => (
  <PageRootContent dimension={dimension} isEditing={puck?.isEditing}>
    {children}
  </PageRootContent>
);
