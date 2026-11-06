import type { PuckComponent } from "@puckeditor/core";

import {
  getDimensionVars,
  getTypographyVars,
} from "@/puck/utils/get-style-vars";

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
  dimension,
  typography,
}) => {
  const styleVars = {
    ...getDimensionVars(dimension),
    ...getTypographyVars(typography),
  };

  return <HeadingBlockUi text={text} styleVars={styleVars} />;
};
