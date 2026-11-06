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
