import type { DecorationProps } from "@/puck/fields/decoration";
import type { SizeProps } from "@/puck/fields/size";
import type { SpacingProps } from "@/puck/fields/spacing";
import type { LayoutProps } from "@/puck/fields/layout";
import type { Responsive } from "@/puck/utils/responsive";
import type { SearchBoxVariant } from "@/shared/components/search/types";

/** Authored content of the Search bar block, grouped in one editor section. */
export type SearchBarContent = {
  /** Placeholder shown inside the search input. */
  placeholder?: string;
  /** `inline` renders the input, `compact` renders an icon button + popover. */
  variant?: SearchBoxVariant;
};

export type SearchBarBlockProps = {
  content?: SearchBarContent;
  layout?: Responsive<LayoutProps>;
  size?: Responsive<SizeProps>;
  spacing?: Responsive<SpacingProps>;
  decoration?: Responsive<DecorationProps>;
};
