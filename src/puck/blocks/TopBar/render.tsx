import type { PuckComponent } from "@puckeditor/core";

import {
  getDecorationVars,
  getDimensionVars,
} from "@/puck/utils/get-style-vars";
import {
  getLayoutVars,
  omitHiddenDisplayVars,
  partitionLayoutVars,
} from "@/puck/fields/layout/get-layout-vars";
import { getLayoutClassNames } from "@/puck/fields/layout/get-layout-classes";
import { cn } from "@/shared/lib/utils";

import {
  TOP_BAR_DEFAULT_DECORATION,
  TOP_BAR_DEFAULT_DIMENSION,
  TOP_BAR_DEFAULT_LAYOUT,
} from "./defaults";
import type { TopBarBlockProps } from "./types";
import { TopBarBlockUi } from "./ui/top-bar";

/**
 * Fallback display for a layout that omits `display`.
 *
 * It mirrors the block default, so a document that authored only flex or grid
 * settings still renders the row it had before, instead of collapsing to an
 * inline box.
 */
const DEFAULT_DISPLAY = TOP_BAR_DEFAULT_LAYOUT.desktop?.display ?? "flex";

/**
 * Give a layout surface an explicit desktop display.
 *
 * `.puck-layout` / `.puck-layout-item` reset the display variables locally, so
 * a layout that omits `display` would resolve to an inline box without this.
 */
const withDesktopDisplay = (vars: Record<string, string>) => ({
  ...vars,
  "--disp-d": vars["--disp-d"] ?? DEFAULT_DISPLAY,
});

/**
 * Pure render shared by the editor canvas and the public Site region.
 *
 * `puck.isEditing` is the only difference between the two paths: the editor
 * keeps a dismissed bar visible so it stays editable, while the public site
 * honours the stored dismissal. Both paths share this single implementation.
 *
 * The layout surface is the slot, like a Container: the authored flex/grid
 * contract arranges the blocks inside the bar. The strip root keeps only the
 * item-level rules (the display rule that hides the whole strip and
 * `align-self`, which describes the bar as a child of its parent), plus its
 * dimension and decoration.
 *
 * The style fallbacks keep a new bar neutral when a document omits the shared
 * fields: Puck merges `defaultProps` in the editor canvas only, not in the
 * public `<Render>`. Both layout surfaces declare an explicit desktop display
 * because the layout classes reset the display variables locally; without it
 * an unauthored value would resolve to an inline box.
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
  const editing = puck?.isEditing ?? false;
  const { displayVars, itemVars, containerVars } = partitionLayoutVars(
    getLayoutVars(effectiveLayout),
  );
  const slotDisplayVars = editing
    ? omitHiddenDisplayVars(displayVars)
    : displayVars;

  // `display` drives both surfaces: it hides the strip on the root and lays out
  // the children on the slot. `align-self` stays item-level only.
  const slotStyleVars: Record<string, string> = withDesktopDisplay({
    ...slotDisplayVars,
    ...containerVars,
  });
  const rootStyleVars: Record<string, string> = {
    ...withDesktopDisplay({ ...displayVars, ...itemVars }),
    ...getDimensionVars(dimension ?? TOP_BAR_DEFAULT_DIMENSION),
    ...getDecorationVars(decoration ?? TOP_BAR_DEFAULT_DECORATION),
  };

  return (
    <TopBarBlockUi
      id={id}
      dismissible={settings?.dismissible}
      styleVars={rootStyleVars}
      editMode={editing}
      dragRef={puck?.dragRef}
      layoutClassName={getLayoutClassNames(effectiveLayout, {
        editing,
      })}
    >
      <Content
        className={cn(
          "puck-top-bar-slot puck-layout min-w-0 w-full",
          settings?.dismissible && "pe-8",
        )}
        style={slotStyleVars}
      />
    </TopBarBlockUi>
  );
};
