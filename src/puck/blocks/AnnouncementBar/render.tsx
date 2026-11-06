import type { PuckComponent } from "@puckeditor/core";

import {
  getDecorationVars,
  getDimensionVars,
  getTypographyVars,
} from "@/puck/utils/get-style-vars";

import {
  ANNOUNCEMENT_DEFAULT_DECORATION,
  ANNOUNCEMENT_DEFAULT_DIMENSION,
  ANNOUNCEMENT_DEFAULT_TYPOGRAPHY,
} from "./defaults";
import type { AnnouncementBarBlockProps } from "./types";
import { AnnouncementBarBlockUi } from "./ui/announcement-bar";

/**
 * Pure render shared by the editor canvas and the public Site region.
 *
 * `puck.isEditing` is the only difference between the two paths: the editor
 * keeps a dismissed banner visible so it stays editable, while the public site
 * honours the stored dismissal. Both paths share this single implementation.
 *
 * The style fallbacks keep documents saved before the shared fields existed at
 * the previous primary palette, small centred type and banner spacing: Puck
 * merges `defaultProps` in the editor canvas only, not in the public `<Render>`.
 */
export const renderAnnouncementBarBlock: PuckComponent<
  AnnouncementBarBlockProps
> = ({
  id,
  text,
  link,
  dimension,
  typography,
  decoration,
  dismissible,
  puck,
}) => {
  const styleVars = {
    ...getDimensionVars(dimension ?? ANNOUNCEMENT_DEFAULT_DIMENSION),
    ...getTypographyVars(typography ?? ANNOUNCEMENT_DEFAULT_TYPOGRAPHY),
    ...getDecorationVars(decoration ?? ANNOUNCEMENT_DEFAULT_DECORATION),
  };

  return (
    <AnnouncementBarBlockUi
      id={id}
      text={text}
      link={link}
      dismissible={dismissible}
      styleVars={styleVars}
      editMode={puck?.isEditing}
    />
  );
};
