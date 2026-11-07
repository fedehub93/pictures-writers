import type { PuckComponent } from "@puckeditor/core";

import {
  getDecorationVars,
  getDimensionVars,
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
 * Dimension and decoration are computed separately: Dimension describes the
 * block box, decoration styles the picture that fills it.
 */
export const renderImageBlock: PuckComponent<ImageBlockProps> = ({
  image,
  layout,
  dimension,
  decoration,
  puck,
}) => {
  return (
    <ImageBlockUi
      image={image}
      layoutVars={getLayoutVars(layout)}
      dimensionVars={getDimensionVars(dimension)}
      decorationVars={getDecorationVars(decoration)}
      layoutClassName={getLayoutClassNames(layout, {
        editing: puck?.isEditing,
      })}
    />
  );
};
