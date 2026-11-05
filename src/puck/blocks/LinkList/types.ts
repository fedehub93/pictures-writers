import type { LinkListItem } from "@/puck/fields/link";

export type LinkListBlockProps = {
  /** Optional heading shown above the list. */
  title?: string;
  /** Ordered links, resolved server-side before the region is rendered. */
  links?: LinkListItem[];
};
