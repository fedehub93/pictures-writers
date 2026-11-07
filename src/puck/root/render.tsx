import type { PuckContext } from "@puckeditor/core";

import { getDimensionVars } from "@/puck/utils/get-style-vars";

import type { RootProps } from "./types";
import { RootBlockUi } from "./ui/root";

/**
 * Design tokens the public site defines in `home.css` and the admin shell
 * defines differently. The canvas must measure like the published page, so the
 * preview root overrides them in editing mode only. Spacing and radius are the
 * two that change `calc(var(--spacing) * n)` utilities and `rounded-*`.
 */
const CANVAS_TOKENS: Record<string, string> = {
  "--spacing": "0.25rem",
  "--radius": "0.5rem",
  fontFamily: "var(--font-canvas)",
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
}: RootProps & { puck?: PuckContext }) => {
  const styleVars = {
    ...getDimensionVars(dimension),
    ...(puck?.isEditing ? CANVAS_TOKENS : {}),
  };

  return <RootBlockUi styleVars={styleVars}>{children}</RootBlockUi>;
};
