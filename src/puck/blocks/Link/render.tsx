import type { PuckComponent } from "@puckeditor/core";

import {
  getDecorationVars,
  getDimensionVars,
  getTypographyVars,
} from "@/puck/utils/get-style-vars";
import { getLayoutVars } from "@/puck/fields/layout/get-layout-vars";
import { getLayoutClassNames } from "@/puck/fields/layout/get-layout-classes";

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
  layout,
  dimension,
  typography,
  decoration,
  puck,
}) => {
  const styleVars = {
    ...getLayoutVars(layout),
    ...getDimensionVars(dimension),
    ...getTypographyVars(typography),
    ...getDecorationVars(decoration),
  };

  return (
    <LinkBlockUi
      link={link}
      styleVars={styleVars}
      layoutClassName={getLayoutClassNames(layout, {
        editing: puck?.isEditing,
      })}
      dragRef={puck?.dragRef}
    />
  );
};
