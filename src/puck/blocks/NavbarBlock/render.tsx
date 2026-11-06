import {
  getDecorationVars,
  getDimensionVars,
} from "@/puck/utils/get-style-vars";

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
  items,
  layout,
  dimension,
  decoration,
}: NavbarBlockRenderProps) => {
  const styleVars = {
    ...getDimensionVars(dimension),
    ...getDecorationVars(decoration),
  };

  return (
    <NavbarBlockUi
      items={items}
      layout={layout}
      styleVars={styleVars}
    />
  );
};
