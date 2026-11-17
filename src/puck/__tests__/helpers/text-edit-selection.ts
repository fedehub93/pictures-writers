import { vi } from "vitest";

import type { TextEditSelectionBridge } from "@/puck/editor/text-edit-mode/selection-bridge";

/**
 * A stand-in for the editor's selection bridge.
 *
 * `deselect` behaves like Puck's action: the selection is cleared and the
 * subscribers are told, which is what a text block sees after the second
 * `Esc`. `select` drives the same change from a test.
 */
export function createTextEditSelection(selected: string | null = null) {
  let current = selected;

  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());

  const bridge: TextEditSelectionBridge = {
    getSelectedBlockId: () => current,
    deselect: vi.fn(() => {
      current = null;
      notify();
    }),
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };

  return {
    bridge,
    select(blockId: string | null) {
      current = blockId;
      notify();
    },
  };
}
