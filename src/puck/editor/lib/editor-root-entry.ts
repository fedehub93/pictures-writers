import type { Config, UiState } from "@puckeditor/core";

/**
 * The Editor root is selected exactly when Puck has no selected item; the
 * canvas deselect and the two entry points this module supports all converge on
 * `itemSelector: null`.
 */
export function isEditorRootActive(
  // `UiState.itemSelector` is `ItemSelector | null`; the extra `undefined`
  // covers a selector the store has not initialised yet.
  itemSelector: UiState["itemSelector"] | undefined,
): boolean {
  return itemSelector == null;
}

/** Heading shown above the root fields in the properties panel. */
export function editorRootSettingsLabel(rootLabel: string): string {
  return `${rootLabel} settings`;
}

/**
 * Readable name for the selected block: its configured `label`, falling back to
 * the component key so an unlabelled block still has a name in the breadcrumb.
 */
export function getSelectedBlockLabel(
  config: Config,
  type: string | undefined,
): string | null {
  if (!type) return null;

  return config.components[type]?.label ?? type;
}

/**
 * Breadcrumb segments for the properties panel header: the document name first,
 * then the selected block when there is one.
 */
export function getEditorRootBreadcrumb({
  rootLabel,
  selectedLabel,
}: {
  rootLabel: string;
  selectedLabel?: string | null;
}): string[] {
  return selectedLabel ? [rootLabel, selectedLabel] : [rootLabel];
}
