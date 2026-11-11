import { ComponentConfig } from "@puckeditor/core";

import { DecorationField } from "@/puck/fields/decoration";
import { DimensionField } from "@/puck/fields/dimension";
import { DisplayOnlyLayoutField } from "@/puck/fields/layout";

import { SEARCH_BAR_DEFAULT_PROPS } from "../defaults";

import { SearchBarContentField } from "./field";
import type { SearchBarBlockProps } from "./types";
import { renderSearchBarBlock } from "./render";

export type { SearchBarBlockProps };

/**
 * The public blog search as a Header block.
 *
 * Placeholder and variant live in the nested content object; the shared
 * Dimension and Decoration fields style the wrapper around the control.
 */
export const SearchBar: ComponentConfig<SearchBarBlockProps> = {
  // The wrapper rendered by `renderSearchBarBlock` is the block root and
  // receives `puck.dragRef`; `inline` is Puck's only supported way to skip its
  // wrapper `div`.
  inline: true,
  fields: {
    content: SearchBarContentField,
    layout: DisplayOnlyLayoutField,
    dimension: DimensionField,
    decoration: DecorationField,
  },
  defaultProps: SEARCH_BAR_DEFAULT_PROPS,
  render: renderSearchBarBlock,
};
