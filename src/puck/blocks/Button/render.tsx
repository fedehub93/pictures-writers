import type { PuckComponent } from "@puckeditor/core";

import {
  getDecorationVars,
  getDimensionVars,
  getTypographyVars,
} from "@/puck/utils/get-style-vars";
import { getLayoutVars } from "@/puck/fields/layout/get-layout-vars";
import { getLayoutClassNames } from "@/puck/fields/layout/get-layout-classes";

import type { ButtonProps } from "./types";
import { ButtonBlockUi } from "./ui/button";
import { BUTTON_BASE_WIDTH } from "./constants";

/**
 * Pure render shared by the editor canvas and the public page.
 *
 * It deliberately imports only the block UI and the shared style-variable
 * utilities so the public render path never pulls in editor field modules.
 */
export const renderButtonBlock: PuckComponent<ButtonProps> = ({
  button,
  layout,
  dimension,
  typography,
  decoration,
  puck,
}) => {
  const styleVars = {
    ...getLayoutVars(layout),
    ...getDimensionVars(dimension, { baseWidth: BUTTON_BASE_WIDTH }),
    ...getTypographyVars(typography),
    ...getDecorationVars(decoration),
  };

  return (
    <ButtonBlockUi
      button={button}
      styleVars={styleVars}
      layoutClassName={getLayoutClassNames(layout, {
        editing: puck?.isEditing,
      })}
      editing={puck?.isEditing}
      dragRef={puck?.dragRef}
    />
  );
};
