import type { PuckComponent } from "@puckeditor/core";

import {
  getDecorationVars,
  getDimensionVars,
  getTypographyVars,
} from "@/puck/utils/get-style-vars";

import type { LinkBlockProps } from "./types";
import { LinkBlockUi } from "./ui/link";

/**
 * Pure render shared by the editor canvas and the public page.
 *
 * It deliberately imports only the block UI and the shared style-variable
 * utilities so the public render path never pulls in editor field modules.
 */
export const renderLinkBlock: PuckComponent<LinkBlockProps> = ({
  link,
  dimension,
  typography,
  decoration,
}) => {
  const styleVars = {
    ...getDimensionVars(dimension),
    ...getTypographyVars(typography),
    ...getDecorationVars(decoration),
  };

  return <LinkBlockUi link={link} styleVars={styleVars} />;
};
