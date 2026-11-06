import { ComponentConfig } from "@puckeditor/core";

import { DecorationField } from "@/puck/fields/decoration";
import { DimensionField } from "@/puck/fields/dimension";
import { DisplayOnlyLayoutField } from "@/puck/fields/layout";

import { SEARCH_BAR_DEFAULT_CONTENT } from "./defaults";
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
  fields: {
    content: SearchBarContentField,
    layout: DisplayOnlyLayoutField,
    dimension: DimensionField,
    decoration: DecorationField,
  },
  defaultProps: {
    content: SEARCH_BAR_DEFAULT_CONTENT,
  },
  render: renderSearchBarBlock,
};
