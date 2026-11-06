import type { DecorationProps } from "@/puck/fields/decoration";
import type { DimensionProps } from "@/puck/fields/dimension";
import type { Responsive } from "@/puck/utils/responsive";
import type { SearchBoxVariant } from "@/shared/components/search/types";

export type SearchBarBlockProps = {
  /** Placeholder shown inside the search input. */
  placeholder?: string;
  /** `inline` renders the input, `compact` renders an icon button + popover. */
  variant?: SearchBoxVariant;
  dimension?: Responsive<DimensionProps>;
  decoration?: Responsive<DecorationProps>;
};
