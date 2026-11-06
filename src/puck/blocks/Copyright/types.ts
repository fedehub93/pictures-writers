import type { LinkListItem } from "@/puck/fields/link";
import type { DimensionProps } from "@/puck/fields/dimension";
import type { TypographyProps } from "@/puck/fields/typography";
import type { Responsive } from "@/puck/utils/responsive";

export type CopyrightBlockProps = {
  /** Include the current year in the copyright line. */
  showYear?: boolean;
  /** Optional text appended after the copyright line. */
  extraText?: string;
  /** Optional links appended after the copyright line. */
  links?: LinkListItem[];
  dimension?: Responsive<DimensionProps>;
  typography?: Responsive<TypographyProps>;
};

export type CopyrightBlockUiProps = CopyrightBlockProps & {
  /** Site name read from Settings by the server renderer. */
  siteName?: string;
  /** Current year, injectable for deterministic rendering. */
  year?: number;
  /** Responsive style variables produced by the shared style utilities. */
  styleVars?: Record<string, string>;
};
