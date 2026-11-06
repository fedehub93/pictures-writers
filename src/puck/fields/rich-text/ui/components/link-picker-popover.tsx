"use client";

import "client-only";

import { useId, useState } from "react";
import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { ExternalLink, Link2, Unlink } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover";

import { isSafeRichTextHref } from "../../link";

type LinkPickerPopoverProps = {
  editor: Editor;
};

type LinkAttributes = {
  href?: string;
  target?: string | null;
};

const readLinkAttributes = (editor: Editor): LinkAttributes =>
  editor.getAttributes("link") as LinkAttributes;

/**
 * Link control for the Puck rich text menu.
 *
 * It can set, edit, remove a link and open the authored href in a new browser
 * tab. `target` and `rel` are only written when the author enables "Open in
 * new tab"; the mark itself never guesses them.
 */
export const LinkPickerPopover = ({ editor }: LinkPickerPopoverProps) => {
  const [open, setOpen] = useState(false);
  const [href, setHref] = useState("");
  const [openInNewTab, setOpenInNewTab] = useState(false);
  const fieldId = useId();

  const linkState = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      const attrs = current ? readLinkAttributes(current) : {};

      return {
        isActive: current?.isActive("link") ?? false,
        href: attrs.href ?? "",
        target: attrs.target ?? null,
      };
    },
  });

  // Seed the form from the link under the caret when the popover opens.
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setHref(linkState?.href ?? "");
      setOpenInNewTab(linkState?.target === "_blank");
    }

    setOpen(nextOpen);
  };

  const isActive = linkState?.isActive ?? false;

  const removeLink = () => {
    setOpen(false);
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
  };

  const applyHref = () => {
    const nextHref = href.trim();

    if (!nextHref) {
      removeLink();
      return;
    }

    // Leave the popover open so the author can fix an unsafe URL.
    if (!isSafeRichTextHref(nextHref)) return;

    setOpen(false);

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({
        href: nextHref,
        target: openInNewTab ? "_blank" : null,
        rel: openInNewTab ? "noopener noreferrer" : null,
      })
      .run();
  };

  const openLink = () => {
    if (linkState?.href) {
      window.open(linkState.href, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          aria-label={isActive ? "Edit link" : "Add link"}
          title={isActive ? "Edit link" : "Add link"}
          aria-pressed={isActive}
          className={cn(
            "flex h-7 items-center justify-center rounded p-0 transition-colors hover:bg-(--puck-color-grey-10) hover:text-(--puck-color-azure-04)",
            isActive && "bg-(--puck-color-grey-10) text-(--puck-color-azure-04)",
          )}
        >
          <Link2 className="size-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-80 space-y-3 p-3">
        <Input
          autoFocus
          value={href}
          onChange={(event) => setHref(event.target.value)}
          placeholder="https://example.com"
          aria-label="Link URL"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              applyHref();
            }
          }}
        />

        <div className="flex items-center gap-2">
          <Checkbox
            id={`${fieldId}-new-tab`}
            checked={openInNewTab}
            onCheckedChange={(checked) => setOpenInNewTab(checked === true)}
          />
          <Label
            htmlFor={`${fieldId}-new-tab`}
            className="cursor-pointer text-xs font-normal"
          >
            Open in new tab
          </Label>
        </div>

        <div className="flex items-center justify-between gap-2 border-t pt-2">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={openLink}
              disabled={!isActive}
            >
              <ExternalLink className="size-4" />
              Open
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeLink}
              disabled={!isActive}
            >
              <Unlink className="size-4" />
              Remove
            </Button>
          </div>
          <Button type="button" size="sm" onClick={applyHref}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
