import type { DecorationProps } from "@/puck/fields/decoration";
import type { DimensionProps } from "@/puck/fields/dimension";
import type { TypographyProps } from "@/puck/fields/typography";
import type {
  LegacyLinkProps,
  LinkProps,
} from "@/puck/fields/link/types";
import type { Responsive } from "@/puck/utils/responsive";

export type AnnouncementBarBlockProps = {
  /** Text shown inside the banner. Empty text hides the block. */
  text?: string;
  /** Optional call to action, resolved server-side before rendering. */
  link?: LinkProps;
  dimension?: Responsive<DimensionProps>;
  typography?: Responsive<TypographyProps>;
  decoration?: Responsive<DecorationProps>;
  /** Show a close button that remembers the dismissal in localStorage. */
  dismissible?: boolean;
};

export type AnnouncementBarBlockUiProps = Omit<
  AnnouncementBarBlockProps,
  "link"
> & {
  /** Puck block id, used as the localStorage namespace for dismissal. */
  id?: string;
  /** The stored SmartLink or the `{ label, href }` shape produced by the resolver. */
  link?: LinkProps | LegacyLinkProps;
  /**
   * True inside the Puck canvas: the banner must stay visible so the user can
   * edit it even after dismissing it on the public site in the same browser.
   */
  editMode?: boolean;
  /** Responsive style variables produced by the shared style utilities. */
  styleVars?: Record<string, string>;
};
