"use client";

import React from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Underline,
} from "lucide-react";
import { Editor, useEditorState } from "@tiptap/react";

import { Separator } from "@/components/ui/separator";

import { cn } from "@/lib/utils";

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";

import { HeadingSelect } from "./heading-select";
import { MarkButton } from "./mark-button";
import { LinkButtonToolbar } from "./extensions/link/ui/LinkButtonToolbar";

export interface MenuBarProps {
  editor: Editor | null;
  showEmbedButton?: boolean;
  sticky?: boolean;
  padding?: "none" | "xs" | "lg";
}

export const MenuBar = ({
  editor,
  showEmbedButton = true,
  sticky = false,
  padding = "lg",
}: MenuBarProps) => {
  // Stato derivato dall'editor, tipato in modo sicuro
  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) {
        return {
          isBold: false,
          isItalic: false,
          isUnderline: false,
          isLink: false,
          isBulletList: false,
          isOrderedList: false,
          isBlockquote: false,
          textAlign: null as "left" | "center" | "right" | "justify" | null,
        };
      }

      return {
        isBold: editor.isActive("bold"),
        isItalic: editor.isActive("italic"),
        isUnderline: editor.isActive("underline"),
        isLink: editor.isActive("link"),
        isBulletList: editor.isActive("bulletList"),
        isOrderedList: editor.isActive("orderedList"),
        isBlockquote: editor.isActive("blockquote"),
        textAlign: editor.isActive({ textAlign: "left" })
          ? "left"
          : editor.isActive({ textAlign: "center" })
          ? "center"
          : editor.isActive({ textAlign: "right" })
          ? "right"
          : editor.isActive({ textAlign: "justify" })
          ? "justify"
          : null,
      };
    },
  });

  if (!editor || !editorState) return null;

  // === Actions ===
  const onClickBold = () => {
    editor.chain().focus().toggleBold().run();
  };
  const onClickItalic = () => {
    editor.chain().focus().toggleItalic().run();
  };
  const onClickUnderline = () => {
    editor.chain().focus().toggleUnderline().run();
  };

  // === Render ===
  return (
    <div
      className={cn(
        "bg-accent border rounded-t-md top-0 z-10 p-2 h-full flex flex-col space-y-4",
        padding === "xs" && "p-1",
        padding === "lg" && "p-4",
        sticky && "sticky"
      )}
    >
      <div className="flex items-center flex-wrap gap-x-1 h-full gap-y-2">
        <HeadingSelect editor={editor} />
        <Separator orientation="vertical" className="mx-2 !h-8" />

        <MarkButton
          onClick={onClickBold}
          isActive={editorState.isBold}
          Icon={Bold}
        />
        <MarkButton
          onClick={onClickItalic}
          isActive={editorState.isItalic}
          Icon={Italic}
        />
        <MarkButton
          onClick={onClickUnderline}
          isActive={editorState.isUnderline}
          Icon={Underline}
        />

        <Separator orientation="vertical" className="bg-slate-300 mx-2 !h-8" />

        <LinkButtonToolbar editor={editor} />

        <Separator orientation="vertical" className="bg-slate-300 mx-2 !h-8" />

        <MarkButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editorState.textAlign === "left"}
          Icon={AlignLeft}
        />
        <MarkButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editorState.textAlign === "center"}
          Icon={AlignCenter}
        />
        <MarkButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editorState.textAlign === "right"}
          Icon={AlignRight}
        />
        <MarkButton
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          isActive={editorState.textAlign === "justify"}
          Icon={AlignJustify}
        />

        <Separator orientation="vertical" className="bg-slate-300 mx-2 !h-8" />

        <MarkButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editorState.isBulletList}
          Icon={List}
        />
        <MarkButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editorState.isOrderedList}
          Icon={ListOrdered}
        />
        <MarkButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editorState.isBlockquote}
          Icon={Quote}
        />
      </div>
    </div>
  );
};
