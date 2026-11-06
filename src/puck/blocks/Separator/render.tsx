import type { PuckComponent } from "@puckeditor/core";

import { getDimensionVars } from "@/puck/utils/get-style-vars";

import type { SeparatorBlockProps } from "./types";
import { SeparatorBlockUi } from "./ui/separator";

/**
 * Pure render shared by the editor canvas and the public page.
 *
 * It deliberately imports only the block UI and the shared style-variable
 * utilities so the public render path never pulls in editor field modules.
 */
export const renderSeparatorBlock: PuckComponent<SeparatorBlockProps> = ({
  dimension,
}) => {
  const styleVars = {
    ...getDimensionVars(dimension),
  };

  return <SeparatorBlockUi styleVars={styleVars} />;
};
