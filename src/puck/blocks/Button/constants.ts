import type { ButtonIconPosition, ButtonVariant } from "./types";

/** The variant an unauthored Button starts from. There is no empty variant. */
export const BUTTON_DEFAULT_VARIANT: ButtonVariant = "primary";

/**
 * The variants the panel offers, in the order it offers them.
 *
 * One list, read by both the panel and the resolver, so a variant the author
 * can pick also has a class the stylesheet paints.
 */
export const BUTTON_VARIANTS = [
  "primary",
  "secondary",
  "outline",
  "ghost",
] as const satisfies readonly ButtonVariant[];

/**
 * The root class carrying the Button's base box.
 *
 * The four paddings that make a Button a target-sized control are declared by
 * this class in `puck-base.css`, as Style variables, exactly like a Variant's
 * look. Keeping them here rather than in the block's default props means an
 * empty Spacing field reads as "nothing authored" and a cleared value returns
 * the box instead of collapsing the Button (ADR-0045).
 */
export const BUTTON_BASE_BOX_CLASS = "puck-button-box";

/**
 * The width a Button resolves to when no width is authored.
 *
 * A Button's root is the anchor itself, so once it becomes a flex or grid item
 * `width: auto` stretches to the row and the button reads as a bar. A natural
 * width keeps the click area on the label; *Fill* stays the deliberate choice
 * for a full-width button.
 *
 * The constant is shared by the Width field and the render, so the panel and
 * the box cannot disagree. It is a block base width, not a document default: no
 * stored document changes and there is no migration.
 */
export const BUTTON_BASE_WIDTH = "fit-content";

/** Where an unauthored Button puts its icon: before the text. */
export const BUTTON_ICON_DEFAULT_POSITION: ButtonIconPosition = "before";

/**
 * The gap between icon and text when none is authored.
 *
 * Half an em follows the button's own type scale: the icon is one em wide, so
 * the pair keeps its rhythm when Typography changes per breakpoint.
 */
export const BUTTON_ICON_DEFAULT_SPACING = "0.5em";
