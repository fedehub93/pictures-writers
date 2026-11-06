import {
  getDecorationVars,
  getDimensionVars,
} from "@/puck/utils/get-style-vars";
import { getLayoutVars } from "@/puck/fields/layout/get-layout-vars";
import { getLayoutClassNames } from "@/puck/fields/layout/get-layout-classes";

import type { NavbarBlockRenderProps } from "./types";
import { NavbarBlockUi } from "./ui/navbar-block";

/**
 * Pure render shared by the editor canvas and the public server renderer.
 *
 * The editor path receives the stored typed menu tree; the server renderer
 * resolves its SmartLinks and calls this function with the resolved tree. It
 * imports only the block UI and the shared style-variable utilities, so the
 * editor canvas stays database-free and the public path never pulls in editor
 * field modules.
 *
 * Dimension and decoration are opt-in: with no value no CSS variables are
 * emitted, so the navigation keeps its own spacing and surface.
 */
export const renderNavbarBlock = ({
  content,
  layout,
  dimension,
  decoration,
  editing,
}: NavbarBlockRenderProps) => {
  const styleVars = {
    ...getLayoutVars(layout),
    ...getDimensionVars(dimension),
    ...getDecorationVars(decoration),
  };

  return (
    <NavbarBlockUi
      items={content?.items}
      layout={content?.layout}
      styleVars={styleVars}
      layoutClassName={getLayoutClassNames(layout, { editing })}
    />
  );
};
