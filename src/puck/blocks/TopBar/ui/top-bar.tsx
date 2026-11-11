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
import { shouldHideTopBar, showsDismissButton } from "../lib/visibility";
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
 *
 * The strip root carries only the block-level rules: visibility, `align-self`,
 * dimension and decoration. The layout that arranges the slot blocks lives on
 * the slot wrapper (see `render.tsx`), so the close button is taken out of flow
 * and pinned to the trailing edge instead of being a flex item of the row.
 */
export const TopBarBlockUi = ({
  id,
  children,
  dismissible = false,
  editMode = false,
  styleVars,
  layoutClassName,
  dragRef,
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
      ref={dragRef}
      className={cn(
        "puck-layout-item puck-top-bar puck-dim puck-deco relative w-full puck-block-root",
        !editMode && "puck-top-bar-public",
        layoutClassName,
      )}
      style={styleVars}
    >
      {children}
      {showsDismissButton({ dismissible, editMode }) ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Dismiss top bar"
          className="absolute end-1 top-1/2 -translate-y-1/2 shrink-0 text-current opacity-70 hover:bg-transparent hover:text-current hover:opacity-100"
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
