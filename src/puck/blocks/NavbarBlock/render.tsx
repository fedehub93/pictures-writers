import {
  getDecorationVars,
  getDimensionVars,
} from "@/puck/utils/get-style-vars";
import { getLayoutVars } from "@/puck/fields/layout/get-layout-vars";
import { getLayoutClassNames } from "@/puck/fields/layout/get-layout-classes";

import { getNavbarAppearanceVars } from "./lib/appearance";
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
 * Dimension, decoration and navigation appearance are opt-in: with no value no
 * CSS variables are emitted, so the navigation keeps its own spacing and
 * surface.
 */
export const renderNavbarBlock = ({
  content,
  appearance,
  layout,
  dimension,
  decoration,
  editing,
  dragRef,
}: NavbarBlockRenderProps) => {
  const appearanceVars = getNavbarAppearanceVars(appearance);
  const styleVars = {
    ...getLayoutVars(layout),
    ...getDimensionVars(dimension),
    ...getDecorationVars(decoration),
    ...appearanceVars,
  };

  return (
    <NavbarBlockUi
      items={content?.items}
      layout={content?.layout}
      collapseAt={content?.collapseAt}
      styleVars={styleVars}
      appearanceVars={appearanceVars}
      layoutClassName={getLayoutClassNames(layout, { editing })}
      editing={editing}
      dragRef={dragRef}
    />
  );
};
