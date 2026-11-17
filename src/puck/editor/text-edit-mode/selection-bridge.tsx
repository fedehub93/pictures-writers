"use client";

import "client-only";

import { createContext, useContext } from "react";

/**
 * What a text block needs to know about the editor's selection.
 *
 * The gate lives on the canvas and must not re-render when the selection
 * moves, so the controller exposes reads and a subscription instead of a
 * value: a gated block learns that it is no longer selected without Puck
 * re-rendering it.
 *
 * `deselect` is Puck's own `setUi` action, exposed here because the canvas has
 * no other way to reach the editor API: a second source of truth for the
 * selection would drift from the properties panel.
 */
export type TextEditSelectionBridge = {
  /** The block currently selected in the editor, if any. */
  getSelectedBlockId: () => string | null;
  /** Clear the selection, through Puck's own action. */
  deselect: () => void;
  /** Notified after the selection changes; returns the unsubscriber. */
  subscribe: (listener: () => void) => () => void;
};

export const TextEditSelectionContext =
  createContext<TextEditSelectionBridge | null>(null);

/** The editor bridge, or `null` outside an editor shell. */
export function useTextEditSelection() {
  return useContext(TextEditSelectionContext);
}
