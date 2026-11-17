"use client";

import "client-only";

import type { ReactNode } from "react";

import { createUsePuck, type Config } from "@puckeditor/core";

import { TextEditSelectionContext } from "./selection-bridge";
import { useTextEditLifecycle } from "./use-text-edit-lifecycle";

const usePuck = createUsePuck<Config>();

/**
 * The editor-side half of text editing mode, mounted once per editor.
 *
 * It reads the three pieces of Puck state the lifecycle needs and hands the
 * blocks a stable bridge to the selection. It has to sit above the canvas —
 * the editor shell wraps its whole layout in it — because the canvas blocks
 * are its descendants through `Puck.Preview`.
 */
export function TextEditModeProvider({ children }: { children: ReactNode }) {
  const selectedBlockId = usePuck(
    (state) => state.selectedItem?.props.id ?? null,
  );
  const previewMode = usePuck((state) => state.appState.ui.previewMode);
  const data = usePuck((state) => state.appState.data);
  const dispatch = usePuck((state) => state.dispatch);

  const selection = useTextEditLifecycle({
    selectedBlockId,
    previewMode,
    data,
    dispatch,
  });

  return (
    <TextEditSelectionContext.Provider value={selection}>
      {children}
    </TextEditSelectionContext.Provider>
  );
}
