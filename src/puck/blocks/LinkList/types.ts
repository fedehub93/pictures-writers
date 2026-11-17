import type { LinkListItem } from "@/puck/fields/link";
import type { SizeProps } from "@/puck/fields/size";
import type { SpacingProps } from "@/puck/fields/spacing";
import type { LayoutProps } from "@/puck/fields/layout";
import type { TypographyProps } from "@/puck/fields/typography";
import type { BlockDragRef } from "@/puck/types";
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
  layout?: Responsive<LayoutProps>;
  size?: Responsive<SizeProps>;
  spacing?: Responsive<SpacingProps>;
  typography?: Responsive<TypographyProps>;
};

/** Inputs accepted by the pure render, before style variables are computed. */
export type LinkListBlockRenderProps = LinkListBlockProps & {
  /**
   * Editor-only: keep hidden blocks selectable and cancel link navigation, so
   * the canvas keeps the click.
   */
  editing?: boolean;
  /** Editor-only: Puck's selection ref, attached to the block root. */
  dragRef?: BlockDragRef;
};

export type LinkListBlockUiProps = {
  /** Optional heading shown above the list. */
  title?: string;
  /** Ordered links, resolved server-side before the region is rendered. */
  links?: LinkListItem[];
  /** Responsive style variables produced by the shared style utilities. */
  styleVars?: Record<string, string>;
  /** Editor visibility classes, empty on the public render. */
  layoutClassName?: string;
  /** Editor-only: cancel link navigation so the canvas keeps the click. */
  editing?: boolean;
  /** Editor-only: Puck's selection ref, attached to the block root. */
  dragRef?: BlockDragRef;
};
