import type { PuckComponent } from "@puckeditor/core";

import {
  getDimensionVars,
  getTypographyVars,
} from "@/puck/utils/get-style-vars";

import type { LinkListBlockProps } from "./types";
import { LinkListBlockUi } from "./ui/link-list";

/**
 * Pure render shared by the editor canvas and the public Site region.
 *
 * It deliberately imports only the block UI and the shared style-variable
 * utilities so the public render path never pulls in editor field modules.
 */
export const renderLinkListBlock: PuckComponent<LinkListBlockProps> = ({
  title,
  links,
  dimension,
  typography,
}) => {
  const styleVars = {
    ...getDimensionVars(dimension),
    ...getTypographyVars(typography),
  };

  return (
    <LinkListBlockUi title={title} links={links} styleVars={styleVars} />
  );
};
