import type { PuckComponent } from "@puckeditor/core";

import {
  getDecorationVars,
  getDimensionVars,
} from "@/puck/utils/get-style-vars";
import { SearchBox } from "@/shared/components/search/search-box";

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
  placeholder,
  variant,
  dimension,
  decoration,
}) => {
  const styleVars = {
    ...getDimensionVars(dimension),
    ...getDecorationVars(decoration),
  };

  return (
    <div className="puck-dim puck-deco" style={styleVars}>
      <SearchBox placeholder={placeholder} variant={variant} />
    </div>
  );
};
