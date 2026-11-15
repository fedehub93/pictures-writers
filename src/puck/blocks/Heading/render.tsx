import type { PuckComponent } from "@puckeditor/core";

import {
  getSizeVars,
  getSpacingVars,
  getTypographyVars,
} from "@/puck/utils/get-style-vars";
import { getLayoutVars } from "@/puck/fields/layout/get-layout-vars";
import { getLayoutClassNames } from "@/puck/fields/layout/get-layout-classes";

import type { HeadingProps } from "./types";
import { HeadingBlockUi } from "./ui/heading";

/**
 * Pure render shared by the editor canvas and the public page.
 *
 * It deliberately imports only the block UI and the shared style-variable
 * utilities so the public render path never pulls in editor field modules.
 */
export const renderHeadingBlock: PuckComponent<HeadingProps> = ({
  text,
  level,
  layout,
  size,
  spacing,
  typography,
  puck,
}) => {
  const styleVars = {
    ...getLayoutVars(layout),
    ...getSizeVars(size),
    ...getSpacingVars(spacing),
    ...getTypographyVars(typography),
  };

  return (
    <HeadingBlockUi
      text={text}
      level={level}
      styleVars={styleVars}
      layoutClassName={getLayoutClassNames(layout, {
        editing: puck?.isEditing,
      })}
      dragRef={puck?.dragRef}
    />
  );
};
