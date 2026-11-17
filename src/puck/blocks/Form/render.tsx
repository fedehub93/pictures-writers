import type { PuckComponent } from "@puckeditor/core";

import { getSizeVars, getSpacingVars } from "@/puck/utils/get-style-vars";
import { getLayoutVars } from "@/puck/fields/layout/get-layout-vars";
import { getLayoutClassNames } from "@/puck/fields/layout/get-layout-classes";

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
  layout,
  size,
  spacing,
  puck,
}) => {
  const styleVars = {
    ...getLayoutVars(layout),
    ...getSizeVars(size),
    ...getSpacingVars(spacing),
  };

  return (
    <FormBlockUi
      form={form}
      styleVars={styleVars}
      layoutClassName={getLayoutClassNames(layout, {
        editing: puck?.isEditing,
      })}
      dragRef={puck?.dragRef}
    />
  );
};
