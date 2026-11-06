import type { DimensionProps } from "@/puck/fields/dimension";
import type { TypographyProps } from "@/puck/fields/typography";
import type { Responsive } from "@/puck/utils/responsive";

export type BrandBlockProps = {
  /** Show the logo (custom or from Installation settings). */
  showLogo?: boolean;
  /** Show the site name (custom or from Installation settings). */
  showSiteName?: boolean;
  /** Override the site name shown next to the logo. */
  customText?: string;
  /** Override the logo URL from Installation settings. */
  customLogoUrl?: string;
  dimension?: Responsive<DimensionProps>;
  typography?: Responsive<TypographyProps>;
};

export type BrandBlockUiProps = BrandBlockProps & {
  /** Site name read from Installation settings by the server renderer. */
  siteName?: string;
  /** Logo URL read from Installation settings by the server renderer. */
  logoUrl?: string;
  /** Responsive style variables produced by the shared style utilities. */
  styleVars?: Record<string, string>;
};
