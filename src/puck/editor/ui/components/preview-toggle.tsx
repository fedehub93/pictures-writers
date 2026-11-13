"use client";
import "client-only";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { createUsePuck, type Config } from "@puckeditor/core";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { getPreviewToggleState } from "../../lib/preview-mode";
import { useEditorStore } from "../../store/use-editor-store";

const usePuck = createUsePuck<Config>();

/**
 * Toggles Puck's interactive preview mode.
 *
 * The properties panel and the save actions are rendered outside Puck's own
 * header, so switching the canvas between editing and interactive preview
 * leaves them available.
 */
export const PreviewToggle = () => {
  const previewMode = usePuck((state) => state.appState.ui.previewMode);
  const dispatch = usePuck((state) => state.dispatch);
  const exitTextEditMode = useEditorStore((state) => state.exitTextEditMode);
  const state = getPreviewToggleState(previewMode);

  return (
    <Button
      type="button"
      variant={state.active ? "secondary" : "ghost"}
      className={cn(
        "h-8 px-3 text-xs flex items-center gap-2",
        state.active ? "text-foreground" : "text-slate-700 hover:text-foreground",
      )}
      aria-pressed={state.active}
      title={state.title}
      onClick={() => {
        // The interactive page replaces the canvas, and Puck keeps the inline
        // editor's formatting toolbar mounted through the swap: end the mode
        // here, while the block and its editor still exist, so the toolbar is
        // handed back instead of re-mounting on the way into edit mode.
        exitTextEditMode();

        dispatch({ type: "setUi", ui: { previewMode: state.nextMode } });
      }}
    >
      {state.active ? (
        <EyeOffIcon className="size-4" />
      ) : (
        <EyeIcon className="size-4" />
      )}
      {state.label}
    </Button>
  );
};
