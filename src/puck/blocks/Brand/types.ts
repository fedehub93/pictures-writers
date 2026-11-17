import type { SizeProps } from "@/puck/fields/size";
import type { SpacingProps } from "@/puck/fields/spacing";
import type { LayoutProps } from "@/puck/fields/layout";
import type { TypographyProps } from "@/puck/fields/typography";
import type { SiteRegionMetadata } from "@/puck/metadata";
import type { BlockDragRef } from "@/puck/types";
import type { Responsive } from "@/puck/utils/responsive";

/** Authored content of the Brand block, grouped in one editor section. */
export type BrandBlockContent = {
  /** Show the logo (custom or from Installation settings). */
  showLogo?: boolean;
  /** Show the site name (custom or from Installation settings). */
  showSiteName?: boolean;
  /** Override the site name shown next to the logo. */
  customText?: string;
  /** Override the logo URL from Installation settings. */
  customLogoUrl?: string;
};

export type BrandBlockProps = {
  content?: BrandBlockContent;
  layout?: Responsive<LayoutProps>;
  size?: Responsive<SizeProps>;
  spacing?: Responsive<SpacingProps>;
  typography?: Responsive<TypographyProps>;
};

/** Inputs accepted by the pure render, before style variables are computed. */
export type BrandBlockRenderProps = BrandBlockProps & {
  /** Site name read from Installation settings by the server renderer. */
  siteName?: string;
  /** Logo URL read from Installation settings by the server renderer. */
  logoUrl?: string;
  /** Installation metadata supplied by the Site region editor canvas. */
  metadata?: SiteRegionMetadata;
  /** True inside the editor canvas, where hidden blocks stay selectable. */
  editing?: boolean;
  /** Editor-only: Puck's selection ref, attached to the block root. */
  dragRef?: BlockDragRef;
};

export type BrandBlockUiProps = {
  content?: BrandBlockContent;
  /** Site name resolved by the renderer: custom text, server props or metadata. */
  siteName?: string;
  /** Logo URL resolved by the renderer: custom URL, server props or metadata. */
  logoUrl?: string;
  /** Responsive style variables produced by the shared style utilities. */
  styleVars?: Record<string, string>;
  /** Editor visibility classes, empty on the public render. */
  layoutClassName?: string;
  /** Editor-only: Puck's selection ref, attached to the block root. */
  dragRef?: BlockDragRef;
};
