"use client";

import "client-only";

import { useEffect, useMemo, useRef } from "react";

import type { Data, PuckAction, UiState } from "@puckeditor/core";

import { useEditorStore } from "@/puck/editor/store/use-editor-store";

import type { TextEditSelectionBridge } from "./selection-bridge";

/**
 * Does the document still contain this block?
 *
 * The armed id is session state, the document is not: a deletion, an undo or a
 * switch to another root can take the block away while the editor store still
 * names it. The walk follows the content arrays and the slot values that hold
 * nested content, and stops at anything that is not a block.
 */
export function documentHasBlock(data: Data, blockId: string): boolean {
  const seen = new Set<object>();

  const hasContent = (content: unknown): boolean => {
    if (!Array.isArray(content)) return false;

    return content.some((item) => {
      if (!isBlockData(item) || seen.has(item)) return false;

      seen.add(item);

      if (item.props.id === blockId) return true;

      return Object.values(item.props).some(hasContent);
    });
  };

  return (
    hasContent(data.content) ||
    (data.root ? Object.values(data.root.props ?? {}).some(hasContent) : false) ||
    Object.values(data.zones ?? {}).some(hasContent)
  );
}

function isBlockData(value: unknown): value is {
  type: string;
  props: Record<string, unknown>;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const candidate = value as { type?: unknown; props?: unknown };

  return (
    typeof candidate.type === "string" &&
    !!candidate.props &&
    typeof candidate.props === "object"
  );
}

type TextEditLifecycleDeps = {
  /** The block Puck has selected, or `null`. */
  selectedBlockId: string | null;
  /** The canvas mode: `"edit"` while the gate is mounted. */
  previewMode: UiState["previewMode"];
  /** The document being edited. */
  data: Data;
  /** Puck's dispatch, for the one deselect the gate needs. */
  dispatch: (action: PuckAction) => void;
};

/**
 * The editor-wide half of text editing mode.
 *
 * One block at a time is armed in the editor store, and the gate on the block
 * owns the gesture that arms it. Everything that is not the block's business
 * lives here: a fresh session starts unarmed, leaving interactive preview ends
 * the mode, and a document that no longer contains the armed block clears it.
 *
 * The returned bridge is stable on purpose: the gates subscribe to it, and a
 * new identity would make every text block resubscribe on each selection.
 */
export function useTextEditLifecycle({
  selectedBlockId,
  previewMode,
  data,
  dispatch,
}: TextEditLifecycleDeps): TextEditSelectionBridge {
  const selectedRef = useRef(selectedBlockId);
  const listenersRef = useRef(new Set<() => void>());

  const bridge = useMemo<TextEditSelectionBridge>(
    () => ({
      getSelectedBlockId: () => selectedRef.current,
      deselect: () =>
        dispatch({
          type: "setUi",
          ui: { itemSelector: null },
          recordHistory: false,
        }),
      subscribe: (listener) => {
        listenersRef.current.add(listener);

        return () => {
          listenersRef.current.delete(listener);
        };
      },
    }),
    [dispatch],
  );

  // The store outlives the page in the tab, so mounting a new editor is the
  // moment to drop an id inherited from the previous session.
  useEffect(() => {
    useEditorStore.getState().exitTextEditMode();
  }, []);

  // The gate subscribes instead of re-rendering, so a selection change is
  // pushed to it here, after the latest id is in the ref.
  useEffect(() => {
    selectedRef.current = selectedBlockId;
    listenersRef.current.forEach((listener) => listener());
  }, [selectedBlockId]);

  // Interactive preview renders the blocks without the gate, so an armed id
  // would otherwise still be there on the way back.
  useEffect(() => {
    if (useEditorStore.getState().editingTextBlockId) {
      useEditorStore.getState().exitTextEditMode();
    }
  }, [previewMode]);

  // A delete, an undo or a root switch can leave the store naming a block the
  // document no longer has.
  useEffect(() => {
    const armedBlockId = useEditorStore.getState().editingTextBlockId;

    if (armedBlockId && !documentHasBlock(data, armedBlockId)) {
      useEditorStore.getState().exitTextEditMode();
    }
  }, [data]);

  return bridge;
}
