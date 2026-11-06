import type { PuckComponent } from "@puckeditor/core";

import {
  getDimensionVars,
  getTypographyVars,
} from "@/puck/utils/get-style-vars";

import type { TextBlockProps } from "./types";
import { TextBlockUi } from "./ui/text";

/**
 * Pure render shared by the editor canvas and the public page.
 *
 * It deliberately imports only the block UI and the shared style-variable
 * utilities so the public render path never pulls in editor field modules.
 */
export const renderTextBlock: PuckComponent<TextBlockProps> = ({
  text,
  dimension,
  typography,
}) => {
  const styleVars = {
    ...getDimensionVars(dimension),
    ...getTypographyVars(typography),
  };

  return <TextBlockUi text={text} styleVars={styleVars} />;
};
