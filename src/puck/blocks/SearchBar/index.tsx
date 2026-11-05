import { ComponentConfig } from "@puckeditor/core";

import { SearchBox } from "@/shared/components/search/search-box";
import {
  SEARCH_BOX_DEFAULT_PLACEHOLDER,
  SEARCH_BOX_DEFAULT_VARIANT,
  type SearchBoxVariant,
} from "@/shared/components/search/types";

import type { SearchBarBlockProps } from "./types";

export type { SearchBarBlockProps };

const VARIANT_OPTIONS: { label: string; value: SearchBoxVariant }[] = [
  { label: "Inline", value: "inline" },
  { label: "Icon button (popover)", value: "compact" },
];

export const SearchBar: ComponentConfig<SearchBarBlockProps> = {
  fields: {
    placeholder: {
      type: "text",
      label: "Placeholder",
    },
    variant: {
      type: "radio",
      label: "Variant",
      options: VARIANT_OPTIONS,
    },
  },
  defaultProps: {
    placeholder: SEARCH_BOX_DEFAULT_PLACEHOLDER,
    variant: SEARCH_BOX_DEFAULT_VARIANT,
  },
  render: ({ placeholder, variant }) => (
    <SearchBox placeholder={placeholder} variant={variant} />
  ),
};
