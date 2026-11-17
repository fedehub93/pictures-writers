import type { PuckComponent } from "@puckeditor/core";

import {
  getDecorationVars,
  getSizeVars,
  getSpacingVars,
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
 *
 * The variant's look and the Button's base box are not resolved here: the
 * document says which variant the Button is, and the block's own classes carry
 * the values as Style variables. The render emits only what the author
 * authored, inline, where it outranks those classes (ADR-0045).
 */
export const renderButtonBlock: PuckComponent<ButtonProps> = ({
  button,
  layout,
  size,
  spacing,
  typography,
  decoration,
  puck,
}) => {
  const styleVars = {
    ...getLayoutVars(layout),
    ...getSizeVars(size, { baseWidth: BUTTON_BASE_WIDTH }),
    ...getSpacingVars(spacing),
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
