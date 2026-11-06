import type { LinkListItem } from "@/puck/fields/link";
import type { DimensionProps } from "@/puck/fields/dimension";
import type { TypographyProps } from "@/puck/fields/typography";
import type { Responsive } from "@/puck/utils/responsive";

/** Authored content of the Link list block, grouped in one editor section. */
export type LinkListBlockContent = {
  /** Optional heading shown above the list. */
  title?: string;
  /** Ordered links, resolved server-side before the region is rendered. */
  links?: LinkListItem[];
};

export type LinkListBlockProps = {
  content?: LinkListBlockContent;
  dimension?: Responsive<DimensionProps>;
  typography?: Responsive<TypographyProps>;
};

export type LinkListBlockUiProps = {
  /** Optional heading shown above the list. */
  title?: string;
  /** Ordered links, resolved server-side before the region is rendered. */
  links?: LinkListItem[];
  /** Responsive style variables produced by the shared style utilities. */
  styleVars?: Record<string, string>;
};
