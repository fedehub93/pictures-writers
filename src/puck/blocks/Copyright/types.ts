import type { LinkListItem } from "@/puck/fields/link";

export type CopyrightBlockProps = {
  /** Include the current year in the copyright line. */
  showYear?: boolean;
  /** Optional text appended after the copyright line. */
  extraText?: string;
  /** Optional links appended after the copyright line. */
  links?: LinkListItem[];
};

export type CopyrightBlockUiProps = CopyrightBlockProps & {
  /** Site name read from Settings by the server renderer. */
  siteName?: string;
  /** Current year, injectable for deterministic rendering. */
  year?: number;
};
