/**
 * Decide whether a dismissible Top bar must be hidden for this visitor.
 *
 * The canvas is always visible so the block can still be selected and edited,
 * and a bar that is not dismissible ignores any stored value.
 */
export function shouldHideTopBar({
  dismissible,
  dismissed,
  editMode,
}: {
  dismissible?: boolean;
  dismissed: boolean;
  editMode?: boolean;
}): boolean {
  return Boolean(dismissible && !editMode && dismissed);
}

/**
 * Decide whether the dismissible bar renders its close button.
 *
 * The button is runtime-only: inside the Puck canvas the bar must stay editable
 * even if the same browser dismissed it on the public site. The block render
 * also uses this to reserve the trailing space the button occupies.
 */
export function showsDismissButton({
  dismissible,
  editMode,
}: {
  dismissible?: boolean;
  editMode?: boolean;
}): boolean {
  return Boolean(dismissible && !editMode);
}
