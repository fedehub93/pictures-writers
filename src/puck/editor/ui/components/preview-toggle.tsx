"use client";
import "client-only";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { createUsePuck, type Config } from "@puckeditor/core";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { getPreviewToggleState } from "../../lib/preview-mode";

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
      onClick={() =>
        dispatch({ type: "setUi", ui: { previewMode: state.nextMode } })
      }
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
