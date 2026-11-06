import type { LinkListItem } from "@/puck/fields/link";
import type { DimensionProps } from "@/puck/fields/dimension";
import type { TypographyProps } from "@/puck/fields/typography";
import type { Responsive } from "@/puck/utils/responsive";

export type LinkListBlockProps = {
  /** Optional heading shown above the list. */
  title?: string;
  /** Ordered links, resolved server-side before the region is rendered. */
  links?: LinkListItem[];
  dimension?: Responsive<DimensionProps>;
  typography?: Responsive<TypographyProps>;
};

export type LinkListBlockUiProps = LinkListBlockProps & {
  /** Responsive style variables produced by the shared style utilities. */
  styleVars?: Record<string, string>;
};
