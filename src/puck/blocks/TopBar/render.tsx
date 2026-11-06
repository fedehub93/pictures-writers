import type { PuckComponent } from "@puckeditor/core";

import {
  getDecorationVars,
  getDimensionVars,
} from "@/puck/utils/get-style-vars";
import { getLayoutVars } from "@/puck/fields/layout/get-layout-vars";
import { getLayoutClassNames } from "@/puck/fields/layout/get-layout-classes";

import {
  TOP_BAR_DEFAULT_DECORATION,
  TOP_BAR_DEFAULT_DIMENSION,
  TOP_BAR_DEFAULT_LAYOUT,
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
 *
 * The slot is rendered here, before crossing into the client UI, and handed
 * over as `children`: a Slot is a function, and React cannot pass functions
 * from a server component to a client component.
 */
export const renderTopBarBlock: PuckComponent<TopBarBlockProps> = ({
  id,
  content: Content,
  settings,
  layout,
  dimension,
  decoration,
  puck,
}) => {
  const effectiveLayout = layout ?? TOP_BAR_DEFAULT_LAYOUT;
  const styleVars = {
    ...getLayoutVars(effectiveLayout),
    ...getDimensionVars(dimension ?? TOP_BAR_DEFAULT_DIMENSION),
    ...getDecorationVars(decoration ?? TOP_BAR_DEFAULT_DECORATION),
  };

  return (
    <TopBarBlockUi
      id={id}
      dismissible={settings?.dismissible}
      styleVars={styleVars}
      editMode={puck?.isEditing}
      layoutClassName={getLayoutClassNames(effectiveLayout, {
        editing: puck?.isEditing,
      })}
    >
      <Content className="puck-top-bar-slot min-w-0 w-full" />
    </TopBarBlockUi>
  );
};
