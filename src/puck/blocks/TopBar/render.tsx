import type { PuckComponent } from "@puckeditor/core";

import {
  getDecorationVars,
  getDimensionVars,
} from "@/puck/utils/get-style-vars";

import {
  TOP_BAR_DEFAULT_DECORATION,
  TOP_BAR_DEFAULT_DIMENSION,
} from "./defaults";
import type { TopBarBlockProps } from "./types";
import { TopBarBlockUi } from "./ui/top-bar";

/**
 * Pure render shared by the editor canvas and the public Site region.
 *
 * `puck.isEditing` is the only difference between the two paths: the editor
 * keeps a dismissed bar visible so it stays editable, while the public site
 * honours the stored dismissal. Both paths share this single implementation.
 *
 * The style fallbacks keep a new bar neutral when a document omits the shared
 * fields: Puck merges `defaultProps` in the editor canvas only, not in the
 * public `<Render>`.
 */
export const renderTopBarBlock: PuckComponent<TopBarBlockProps> = ({
  id,
  content: Content,
  settings,
  dimension,
  decoration,
  puck,
}) => {
  const styleVars = {
    ...getDimensionVars(dimension ?? TOP_BAR_DEFAULT_DIMENSION),
    ...getDecorationVars(decoration ?? TOP_BAR_DEFAULT_DECORATION),
  };

  return (
    <TopBarBlockUi
      id={id}
      Content={Content}
      dismissible={settings?.dismissible}
      styleVars={styleVars}
      editMode={puck?.isEditing}
    />
  );
};
