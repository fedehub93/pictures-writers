import type { LinkListItem } from "@/puck/fields/link";
import type { DimensionProps } from "@/puck/fields/dimension";
import type { LayoutProps } from "@/puck/fields/layout";
import type { TypographyProps } from "@/puck/fields/typography";
import type { SiteRegionMetadata } from "@/puck/metadata";
import type { BlockDragRef } from "@/puck/types";
import type { Responsive } from "@/puck/utils/responsive";

/** Authored content of the Copyright block, grouped in one editor section. */
export type CopyrightBlockContent = {
  /** Include the current year in the copyright line. */
  showYear?: boolean;
  /** Optional text appended after the copyright line. */
  extraText?: string;
  /** Optional links appended after the copyright line. */
  links?: LinkListItem[];
};

export type CopyrightBlockProps = {
  content?: CopyrightBlockContent;
  layout?: Responsive<LayoutProps>;
  dimension?: Responsive<DimensionProps>;
  typography?: Responsive<TypographyProps>;
};

/** Inputs accepted by the pure render, before style variables are computed. */
export type CopyrightBlockRenderProps = CopyrightBlockProps & {
  /** Site name read from Installation settings by the server renderer. */
  siteName?: string;
  /** Current year, injectable for deterministic rendering. */
  year?: number;
  /** Installation metadata supplied by the Site region editor canvas. */
  metadata?: SiteRegionMetadata;
  /** True inside the editor canvas, where hidden blocks stay selectable. */
  editing?: boolean;
  /** Editor-only: Puck's selection ref, attached to the block root. */
  dragRef?: BlockDragRef;
};

export type CopyrightBlockUiProps = {
  content?: CopyrightBlockContent;
  /** Site name resolved by the renderer: server props or metadata. */
  siteName?: string;
  /** Current year, injectable for deterministic rendering. */
  year?: number;
  /** Responsive style variables produced by the shared style utilities. */
  styleVars?: Record<string, string>;
  /** Editor visibility classes, empty on the public render. */
  layoutClassName?: string;
  /** Editor-only: Puck's selection ref, attached to the block root. */
  dragRef?: BlockDragRef;
};
