import type { PuckComponent } from "@puckeditor/core";

import {
  getDecorationVars,
  getDimensionVars,
} from "@/puck/utils/get-style-vars";

import type { ImageBlockProps } from "./types";
import { ImageBlockUi } from "./ui/image";

/**
 * Pure render shared by the editor canvas and the public page.
 *
 * It deliberately imports only the block UI and the shared style-variable
 * utilities so the public render path never pulls in editor field modules.
 */
export const renderImageBlock: PuckComponent<ImageBlockProps> = ({
  image,
  dimension,
  decoration,
}) => {
  const styleVars = {
    ...getDimensionVars(dimension),
    ...getDecorationVars(decoration),
  };

  return <ImageBlockUi image={image} styleVars={styleVars} />;
};
