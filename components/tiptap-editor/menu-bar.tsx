"use client";

import React from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Underline,
} from "lucide-react";
import { Editor } from "@tiptap/react";

import { Separator } from "@/components/ui/separator";

import { cn } from "@/lib/utils";
import { HeadingSelect } from "./heading-select";
import { MarkButton } from "./mark-button";

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
  if (!editor) return null;

  const onClickBold = () => {
    editor?.chain().focus().toggleBold().run();
  };
  const onClickItalic = () => {
    editor?.chain().focus().toggleItalic().run();
  };
  const onClickUnderline = () => {
    editor?.chain().focus().toggleUnderline().run();
  };

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
          isActive={editor?.isActive("bold")}
          Icon={Bold}
        />
        <MarkButton
          onClick={onClickItalic}
          isActive={editor?.isActive("italic")}
          Icon={Italic}
        />
        <MarkButton
          onClick={onClickUnderline}
          isActive={editor?.isActive("underline")}
          Icon={Underline}
        />
        <Separator orientation="vertical" className="bg-slate-300 mx-2 !h-8" />
        <MarkButton
          onClick={() => editor?.chain().focus().setTextAlign("left").run()}
          isActive={editor?.isActive({ textAlign: "left" })}
          Icon={AlignLeft}
        />
        <MarkButton
          onClick={() => editor?.chain().focus().setTextAlign("center").run()}
          isActive={editor?.isActive({ textAlign: "center" })}
          Icon={AlignCenter}
        />
        <MarkButton
          onClick={() => editor?.chain().focus().setTextAlign("right").run()}
          isActive={editor?.isActive({ textAlign: "right" })}
          Icon={AlignRight}
        />
        <MarkButton
          onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
          isActive={editor?.isActive({ textAlign: "justify" })}
          Icon={AlignJustify}
        />
        <Separator orientation="vertical" className="bg-slate-300 mx-2 !h-8" />
        <MarkButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor?.isActive("bulletList")}
          Icon={List}
        />
        <MarkButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor?.isActive("orderedList")}
          Icon={ListOrdered}
        />
        <MarkButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor?.isActive("blockquote")}
          Icon={Quote}
        />
      </div>
    </div>
  );
};
