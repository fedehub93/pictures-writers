"use client";

import "client-only";

import { Config, createUsePuck } from "@puckeditor/core";

import {
  getSelectedBlockLabel,
  isEditorRootActive,
} from "../../lib/editor-root-entry";

const usePuck = createUsePuck<Config>();

/**
 * Puck selection state shared by the Outline row and the properties-panel
 * header, plus the deselect action that makes the Editor root current.
 *
 * The deselect reuses Puck's own `setUi` action so no second source of truth is
 * introduced and the undo/redo history is left untouched.
 */
export function useEditorRootEntry() {
  const itemSelector = usePuck((state) => state.appState.ui.itemSelector);
  const selectedItem = usePuck((state) => state.selectedItem);
  const config = usePuck((state) => state.config);
  const dispatch = usePuck((state) => state.dispatch);

  const isActive = isEditorRootActive(itemSelector);
  const selectedLabel = isActive
    ? null
    : getSelectedBlockLabel(config, selectedItem?.type);

  const onSelectRoot = () => {
    if (isActive) return;

    dispatch({
      type: "setUi",
      ui: { itemSelector: null },
      recordHistory: false,
    });
  };

  return { selectedLabel, isActive, onSelectRoot };
}
