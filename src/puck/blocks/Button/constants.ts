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
