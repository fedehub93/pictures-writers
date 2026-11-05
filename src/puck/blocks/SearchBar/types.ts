import type { SearchBoxVariant } from "@/shared/components/search/types";

export type SearchBarBlockProps = {
  /** Placeholder shown inside the search input. */
  placeholder?: string;
  /** `inline` renders the input, `compact` renders an icon button + popover. */
  variant?: SearchBoxVariant;
};
