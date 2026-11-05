"use client";
import "client-only";

import { useCallback, useSyncExternalStore } from "react";
import { XIcon } from "lucide-react";

import { InlineSmartLink } from "@/puck/fields/link/ui/inline-link";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import {
  dismissAnnouncement,
  isAnnouncementDismissed,
  subscribeToAnnouncement,
} from "../lib/storage";
import type { AnnouncementBarBlockUiProps } from "../types";

/**
 * Thin, optionally dismissible banner shown above the header.
 *
 * Links are already resolved by the time the block reaches the public page, so
 * a missing/broken target degrades to plain text instead of a dead anchor.
 * Dismissal is read through `useSyncExternalStore`: the server snapshot is
 * always visible, so returning visitors are only hidden after hydration.
 *
 * The close button is runtime-only: inside the Puck canvas the banner must
 * stay editable even if the same browser dismissed it on the public site.
 */
export const AnnouncementBarBlockUi = ({
  id,
  text,
  link,
  backgroundColor,
  textColor,
  dismissible = false,
  editMode = false,
}: AnnouncementBarBlockUiProps) => {
  const content = text?.trim() ?? "";

  const subscribe = useCallback(
    (listener: () => void) =>
      id && content
        ? subscribeToAnnouncement(id, content, listener)
        : () => undefined,
    [id, content],
  );
  const getSnapshot = useCallback(
    () => (id && content ? isAnnouncementDismissed(id, content) : false),
    [id, content],
  );

  const dismissed = useSyncExternalStore(subscribe, getSnapshot, () => false);

  if (!content) return null;
  if (dismissible && !editMode && dismissed) return null;

  const message = (
    <span className="line-clamp-2 text-center text-xs leading-tight">
      {content}
    </span>
  );

  return (
    <div
      style={{
        backgroundColor: backgroundColor || undefined,
        color: textColor || undefined,
      }}
      className={cn(
        "relative flex min-h-8 w-full items-center justify-center px-10 py-1.5",
        !backgroundColor && "bg-primary",
        !textColor && "text-primary-foreground",
      )}
    >
      {link ? (
        <InlineSmartLink
          link={link}
          className="underline-offset-2 hover:underline"
        >
          {message}
        </InlineSmartLink>
      ) : (
        message
      )}
      {dismissible && !editMode ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Dismiss announcement"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-current opacity-70 hover:bg-transparent hover:text-current hover:opacity-100"
          onClick={() => {
            if (id) dismissAnnouncement(id, content);
          }}
        >
          <XIcon />
        </Button>
      ) : null}
    </div>
  );
};
