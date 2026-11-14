import type { Responsive } from "@/puck/utils/responsive";
import type { DimensionProps } from "@/puck/fields/dimension";
import type { TypographyProps } from "@/puck/fields/typography";
import type { DecorationProps } from "@/puck/fields/decoration";
import type { LayoutProps } from "@/puck/fields/layout";
import type { IconProps } from "@/puck/fields/icon";
import type { LinkProps } from "@/puck/fields/link";

/** Where the optional icon sits relative to the button text. */
export type ButtonIconPosition = "before" | "after";

/**
 * The authored content of a Button: one text, one target and one optional
 * icon.
 *
 * The text is stored as the Smart link's label, so auto-filling it from the
 * linked entity's title keeps working. The panel presents the text first
 * (`ui/view/button-content-view.tsx`) without changing the stored shape.
 */
export type ButtonContentProps = {
  link?: LinkProps;
  icon?: IconProps;
  iconPosition?: ButtonIconPosition;
  /** The space between icon and text; a CSS length such as `0.5em`. */
  iconSpacing?: string;
};

export type ButtonProps = {
  button?: ButtonContentProps;
  layout?: Responsive<LayoutProps>;
  dimension?: Responsive<DimensionProps>;
  typography?: Responsive<TypographyProps>;
  decoration?: Responsive<DecorationProps>;
};
