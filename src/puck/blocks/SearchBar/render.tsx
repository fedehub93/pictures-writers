import type { PuckComponent } from "@puckeditor/core";

import {
  getDecorationVars,
  getDimensionVars,
} from "@/puck/utils/get-style-vars";
import { getLayoutVars } from "@/puck/fields/layout/get-layout-vars";
import { getLayoutClassNames } from "@/puck/fields/layout/get-layout-classes";
import { SearchBox } from "@/shared/components/search/search-box";
import { cn } from "@/shared/lib/utils";

import type { SearchBarBlockProps } from "./types";

/**
 * Pure render shared by the editor canvas and the public Site region.
 *
 * It deliberately imports only the search UI and the shared style-variable
 * utilities so the public render path never pulls in editor field modules.
 *
 * The fields are opt-in: with no value no CSS variables are emitted, so the
 * search control keeps its own spacing, surface and variant behaviour. The
 * variables sit on a wrapper so the same fields style the whole block in both
 * the inline and the compact variant.
 */
export const renderSearchBarBlock: PuckComponent<SearchBarBlockProps> = ({
  content,
  layout,
  dimension,
  decoration,
  puck,
}) => {
  const styleVars = {
    ...getLayoutVars(layout),
    ...getDimensionVars(dimension),
    ...getDecorationVars(decoration),
  };

  return (
    // The wrapper is the block root: it carries the authored surface and the
    // layout classes, so the editor selects this element rather than a wrapper
    // inserted around it.
    <div
      ref={puck?.dragRef}
      className={cn(
        "puck-dim puck-deco",
        getLayoutClassNames(layout, { editing: puck?.isEditing }),
      )}
      style={styleVars}
    >
      <SearchBox
        placeholder={content?.placeholder}
        variant={content?.variant}
      />
    </div>
  );
};
