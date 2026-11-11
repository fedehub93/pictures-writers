import type { PuckComponent } from "@puckeditor/core";

import {
  getDimensionVars,
  getTypographyVars,
} from "@/puck/utils/get-style-vars";
import { getLayoutVars } from "@/puck/fields/layout/get-layout-vars";
import { getLayoutClassNames } from "@/puck/fields/layout/get-layout-classes";

import type { LinkListBlockProps } from "./types";
import { LinkListBlockUi } from "./ui/link-list";

/**
 * Pure render shared by the editor canvas and the public Site region.
 *
 * It deliberately imports only the block UI and the shared style-variable
 * utilities so the public render path never pulls in editor field modules.
 */
export const renderLinkListBlock: PuckComponent<LinkListBlockProps> = ({
  content,
  layout,
  dimension,
  typography,
  puck,
}) => {
  const styleVars = {
    ...getLayoutVars(layout),
    ...getDimensionVars(dimension),
    ...getTypographyVars(typography),
  };

  return (
    <LinkListBlockUi
      title={content?.title}
      links={content?.links}
      styleVars={styleVars}
      layoutClassName={getLayoutClassNames(layout, {
        editing: puck?.isEditing,
      })}
      dragRef={puck?.dragRef}
    />
  );
};
