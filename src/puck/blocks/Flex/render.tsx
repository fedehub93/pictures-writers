import type { PuckComponent } from "@puckeditor/core";

import {
  getDecorationVars,
  getDimensionVars,
  getTypographyVars,
} from "@/puck/utils/get-style-vars";
import { getLayoutVars } from "@/puck/fields/layout/get-layout-vars";
import { getLayoutClassNames } from "@/puck/fields/layout/get-layout-classes";
import { SlotSurface } from "@/puck/components/slot-surface";

import type { FlexBlockProps } from "./types";

/**
 * Pure render shared by the editor canvas and the public page.
 *
 * It deliberately imports only the shared slot surface and the style-variable
 * utilities so the public render path never pulls in editor field modules.
 */
export const renderFlexBlock: PuckComponent<FlexBlockProps> = ({
  layout,
  dimension,
  typography,
  decoration,
  items: Items,
  puck,
}) => {
  const styleVars = {
    ...getLayoutVars(layout),
    ...getDimensionVars(dimension),
    ...getTypographyVars(typography),
    ...getDecorationVars(decoration),
  };

  return (
    <SlotSurface
      Items={Items}
      styleVars={styleVars}
      layoutClassName={getLayoutClassNames(layout, {
        editing: puck?.isEditing,
      })}
      dragRef={puck?.dragRef}
    />
  );
};
