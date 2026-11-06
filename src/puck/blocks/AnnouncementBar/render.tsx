import type { PuckComponent } from "@puckeditor/core";

import type { AnnouncementBarBlockProps } from "./types";
import { AnnouncementBarBlockUi } from "./ui/announcement-bar";

/**
 * Pure render shared by the editor canvas and the public Site region.
 *
 * `puck.isEditing` is the only difference between the two paths: the editor
 * keeps a dismissed banner visible so it stays editable, while the public site
 * honours the stored dismissal. Both paths share this single implementation.
 */
export const renderAnnouncementBarBlock: PuckComponent<
  AnnouncementBarBlockProps
> = ({ id, text, link, backgroundColor, textColor, dismissible, puck }) => (
  <AnnouncementBarBlockUi
    id={id}
    text={text}
    link={link}
    backgroundColor={backgroundColor}
    textColor={textColor}
    dismissible={dismissible}
    editMode={puck?.isEditing}
  />
);
