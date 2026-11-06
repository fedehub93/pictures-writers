import type { PuckComponent } from "@puckeditor/core";

import { getDimensionVars } from "@/puck/utils/get-style-vars";

import type { FormBlockProps } from "./types";
import { FormBlockUi } from "./ui/form";

/**
 * Pure render shared by the editor canvas and the public page.
 *
 * It deliberately imports only the block UI and the shared style-variable
 * utilities so the public render path never pulls in editor field modules.
 */
export const renderFormBlock: PuckComponent<FormBlockProps> = ({
  form,
  dimension,
}) => {
  const styleVars = {
    ...getDimensionVars(dimension),
  };

  return <FormBlockUi form={form} styleVars={styleVars} />;
};
