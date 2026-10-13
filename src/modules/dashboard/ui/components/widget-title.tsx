"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";

import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/utils";
import { WIDGET_TITLE_MAX_LENGTH } from "@/shared/dashboard/types";

interface WidgetTitleProps {
  /** The effective title currently shown (override or default). */
  title: string;
  /** The new title, or `undefined` to clear the override and restore the default. */
  onRename: (title: string | undefined) => void;
}

/**
 * The card's title as an in-place, keyboard-accessible rename control: it looks
 * like the widget title but is a focusable button, revealed on hover/focus, that
 * turns into an input on activation. Enter or blur saves, Escape reverts, an
 * empty value restores the definition's default title.
 */
export const WidgetTitle = ({ title, onRename }: WidgetTitleProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [previousTitle, setPreviousTitle] = useState(title);

  if (previousTitle !== title) {
    setPreviousTitle(title);
    if (!isEditing) setValue(title);
  }

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commit = () => {
    const trimmed = value.trim();
    onRename(trimmed.length > 0 ? trimmed : undefined);
    setIsEditing(false);
  };

  const cancel = () => {
    setValue(title);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={value}
        maxLength={WIDGET_TITLE_MAX_LENGTH}
        aria-label="Widget title"
        onChange={(event) => setValue(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          } else if (event.key === "Escape") {
            event.preventDefault();
            cancel();
          }
        }}
        className="h-7 w-full px-2 text-sm font-medium"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      aria-label={`Rename ${title}`}
      className={cn(
        "group/title -mx-1 flex min-w-0 items-center gap-1 rounded px-1 text-left text-sm font-medium",
        "transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <span className="truncate">{title}</span>
      <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/title:opacity-100 group-focus-visible/title:opacity-100" />
    </button>
  );
};
