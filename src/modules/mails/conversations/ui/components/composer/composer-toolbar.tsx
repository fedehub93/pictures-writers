"use client";

import { useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import { Editor, useEditorState } from "@tiptap/react";

import { MarkButton } from "@/shared/components/tiptap-editor/mark-button";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover";
import { Separator } from "@/shared/ui/separator";
import { Toggle } from "@/shared/ui/toggle";

interface ComposerToolbarProps {
  editor: Editor | null;
}

export const ComposerToolbar = ({ editor }: ComposerToolbarProps) => {
  const [linkUrl, setLinkUrl] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);

  const state = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) {
        return {
          bold: false,
          italic: false,
          underline: false,
          strike: false,
          link: false,
          bulletList: false,
          orderedList: false,
          alignLeft: false,
          alignCenter: false,
          alignRight: false,
          canUndo: false,
          canRedo: false,
        };
      }

      return {
        bold: editor.isActive("bold"),
        italic: editor.isActive("italic"),
        underline: editor.isActive("underline"),
        strike: editor.isActive("strike"),
        link: editor.isActive("link"),
        bulletList: editor.isActive("bulletList"),
        orderedList: editor.isActive("orderedList"),
        alignLeft: editor.isActive({ textAlign: "left" }),
        alignCenter: editor.isActive({ textAlign: "center" }),
        alignRight: editor.isActive({ textAlign: "right" }),
        canUndo: editor.can().undo(),
        canRedo: editor.can().redo(),
      };
    },
  });

  if (!editor || !state) return null;

  const applyLink = () => {
    const href = linkUrl.trim();
    setLinkOpen(false);
    setLinkUrl("");

    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href })
      .run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b px-2 py-1.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        disabled={!state.canUndo}
        onClick={() => editor.chain().focus().undo().run()}
        aria-label="Undo"
      >
        <Undo2 className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        disabled={!state.canRedo}
        onClick={() => editor.chain().focus().redo().run()}
        aria-label="Redo"
      >
        <Redo2 className="size-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <MarkButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={state.bold}
        Icon={Bold}
        label="Bold"
      />
      <MarkButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={state.italic}
        Icon={Italic}
        label="Italic"
      />
      <MarkButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={state.underline}
        Icon={Underline}
        label="Underline"
      />
      <MarkButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={state.strike}
        Icon={Strikethrough}
        label="Strikethrough"
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      <MarkButton
        onClick={() =>
          editor.chain().focus().setTextAlign("left").run()
        }
        isActive={state.alignLeft}
        Icon={AlignLeft}
        label="Align left"
      />
      <MarkButton
        onClick={() =>
          editor.chain().focus().setTextAlign("center").run()
        }
        isActive={state.alignCenter}
        Icon={AlignCenter}
        label="Align center"
      />
      <MarkButton
        onClick={() =>
          editor.chain().focus().setTextAlign("right").run()
        }
        isActive={state.alignRight}
        Icon={AlignRight}
        label="Align right"
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      <MarkButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={state.bulletList}
        Icon={List}
        label="Bullet list"
      />
      <MarkButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={state.orderedList}
        Icon={ListOrdered}
        label="Numbered list"
      />

      <Popover open={linkOpen} onOpenChange={setLinkOpen}>
        <PopoverTrigger asChild>
          <Toggle
            type="button"
            variant="outline"
            size="sm"
            pressed={state.link}
            aria-label="Link"
            className="bg-background"
          >
            <LinkIcon className="size-4" />
          </Toggle>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72">
          <div className="flex flex-col gap-2">
            <Input
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              placeholder="https://example.com"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyLink();
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setLinkOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={applyLink}>
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
