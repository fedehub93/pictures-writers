"use client";
import "client-only";

import { useCallback, useSyncExternalStore } from "react";
import { XIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import {
  dismissTopBar,
  isTopBarDismissed,
  subscribeToTopBar,
} from "../lib/storage";
import { shouldHideTopBar } from "../lib/visibility";
import type { TopBarBlockUiProps } from "../types";

/**
 * Full-width strip shown above the header.
 *
 * The content is a Puck slot, so the strip renders whatever blocks the editor
 * placed inside it. An empty slot leaves no visible strip on the public site
 * (`.puck-top-bar-public` is hidden when its slot is empty) while the canvas
 * keeps the drop zone so the bar can be built.
 *
 * Dismissal is read through `useSyncExternalStore`: the server snapshot is
 * always visible, so returning visitors are only hidden after hydration. The
 * close button is runtime-only: inside the Puck canvas the bar must stay
 * editable even if the same browser dismissed it on the public site.
 */
export const TopBarBlockUi = ({
  id,
  children,
  dismissible = false,
  editMode = false,
  styleVars,
  layoutClassName,
}: TopBarBlockUiProps) => {
  const subscribe = useCallback(
    (listener: () => void) =>
      id ? subscribeToTopBar(id, listener) : () => undefined,
    [id],
  );
  const getSnapshot = useCallback(
    () => (id ? isTopBarDismissed(id) : false),
    [id],
  );

  const dismissed = useSyncExternalStore(subscribe, getSnapshot, () => false);

  if (shouldHideTopBar({ dismissible, dismissed, editMode })) return null;

  return (
    <div
      className={cn(
        "puck-layout puck-top-bar puck-dim puck-deco relative flex w-full items-center",
        !editMode && "puck-top-bar-public",
        layoutClassName,
      )}
      style={styleVars}
    >
      {children}
      {dismissible && !editMode ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Dismiss top bar"
          className="ml-2 shrink-0 text-current opacity-70 hover:bg-transparent hover:text-current hover:opacity-100"
          onClick={() => {
            if (id) dismissTopBar(id);
          }}
        >
          <XIcon />
        </Button>
      ) : null}
    </div>
  );
};
