import type { PuckComponent } from "@puckeditor/core";

import {
  HOVER_STATE,
  getDecorationStateVars,
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
import { resolveButtonVariantStyles } from "./variants";

/**
 * Pure render shared by the editor canvas and the public page.
 *
 * It deliberately imports only the block UI and the shared style-variable
 * utilities so the public render path never pulls in editor field modules.
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
  const variantStyles = resolveButtonVariantStyles(button?.variant, {
    typography,
    decoration,
  });

  const styleVars = {
    ...getLayoutVars(layout),
    ...getSizeVars(size, { baseWidth: BUTTON_BASE_WIDTH }),
    ...getSpacingVars(spacing),
    ...getTypographyVars(variantStyles.typography),
    ...getDecorationVars(variantStyles.decoration),
    // The hover state appends its own variables; the stylesheet reads them and
    // derives one from the base colour where the variant dictates none.
    ...getDecorationStateVars(variantStyles.hover, HOVER_STATE),
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
