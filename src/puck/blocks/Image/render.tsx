import type { PuckComponent } from "@puckeditor/core";

import {
  getDecorationVars,
  getSizeVars,
  getSpacingVars,
} from "@/puck/utils/get-style-vars";
import { getLayoutVars } from "@/puck/fields/layout/get-layout-vars";
import { getLayoutClassNames } from "@/puck/fields/layout/get-layout-classes";

import type { ImageBlockProps } from "./types";
import { ImageBlockUi } from "./ui/image";

/**
 * Pure render shared by the editor canvas and the public page.
 *
 * It deliberately imports only the block UI and the shared style-variable
 * utilities so the public render path never pulls in editor field modules.
 *
 * Size, spacing and decoration are computed separately: Size describes the
 * block box, spacing the space around and inside it, and decoration styles the
 * picture that fills it.
 */
export const renderImageBlock: PuckComponent<ImageBlockProps> = ({
  image,
  layout,
  size,
  spacing,
  decoration,
  puck,
}) => {
  return (
    <ImageBlockUi
      image={image}
      layoutVars={getLayoutVars(layout)}
      sizeVars={getSizeVars(size)}
      spacingVars={getSpacingVars(spacing)}
      decorationVars={getDecorationVars(decoration)}
      layoutClassName={getLayoutClassNames(layout, {
        editing: puck?.isEditing,
      })}
      editing={puck?.isEditing}
      dragRef={puck?.dragRef}
    />
  );
};
