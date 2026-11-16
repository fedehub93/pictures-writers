import type { Responsive } from "@/puck/utils/responsive";
import type { SizeProps } from "@/puck/fields/size";
import type { SpacingProps } from "@/puck/fields/spacing";
import type { TypographyProps } from "@/puck/fields/typography";
import type { DecorationProps } from "@/puck/fields/decoration";
import type { LayoutProps } from "@/puck/fields/layout";
import type { IconProps } from "@/puck/fields/icon";
import type { LinkProps } from "@/puck/fields/link";

/** Where the optional icon sits relative to the button text. */
export type ButtonIconPosition = "before" | "after";

/**
 * The starting look of a Button.
 *
 * The document stores the name only: the look is a class on the Block root
 * (`puck-button-<variant>`) that declares the Variant's Style variables, one
 * specificity level below an authored inline value (ADR-0045).
 */
export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";

/**
 * The authored content of a Button: one text, one target, one optional icon
 * and the variant it starts from.
 *
 * The text is stored as the Smart link's label, so auto-filling it from the
 * linked entity's title keeps working. The panel presents the variant first
 * and the text first of the content (`ui/view/button-content-view.tsx`)
 * without changing the stored shape.
 */
export type ButtonContentProps = {
  variant?: ButtonVariant;
  link?: LinkProps;
  icon?: IconProps;
  iconPosition?: ButtonIconPosition;
  /** The space between icon and text; a CSS length such as `0.5em`. */
  iconSpacing?: string;
};

export type ButtonProps = {
  button?: ButtonContentProps;
  layout?: Responsive<LayoutProps>;
  size?: Responsive<SizeProps>;
  spacing?: Responsive<SpacingProps>;
  typography?: Responsive<TypographyProps>;
  decoration?: Responsive<DecorationProps>;
};
