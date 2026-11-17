import { BUTTON_DEFAULT_VARIANT, BUTTON_VARIANTS } from "./constants";
import type { ButtonVariant } from "./types";

/**
 * The variant a stored document resolves to.
 *
 * Stored Puck data is not validated, so a name the four no longer contain must
 * still carry a look: it falls back to the default rather than stripping the
 * Button of its class. The name stays the document's; this is read, not stored.
 */
const resolveButtonVariant = (
  stored: ButtonVariant | undefined,
): ButtonVariant =>
  stored !== undefined && BUTTON_VARIANTS.includes(stored)
    ? stored
    : BUTTON_DEFAULT_VARIANT;

/**
 * The root class carrying the variant's look.
 *
 * The look itself lives in `puck-base.css`, as the same Style variables the
 * render used to write onto every instance. A class declaration sits one
 * specificity level below an inline one, so an authored value still wins and
 * the variant is a starting point, not a lock (ADR-0045).
 */
export const getButtonVariantClass = (variant: ButtonVariant | undefined) =>
  `puck-button-${resolveButtonVariant(variant)}`;
