"use client";

import { Bold, Italic, Underline } from "lucide-react";
import { Editor, useEditorState } from "@tiptap/react";

import { cn } from "@/shared/lib/utils";

import { MarkButton } from "@/shared/components/tiptap-editor/mark-button";
import { LinkButtonToolbar } from "@/shared/components/tiptap-editor/extensions/link/ui/LinkButtonToolbar";

export interface MenuBarProps {
  editor: Editor | null;
}

export const MenuBar = ({ editor }: MenuBarProps) => {
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

  return (
    <div
      className={cn(
        "bg-accent/20 border-b rounded-t-md top-0 z-10 h-full flex flex-col space-y-4",
      )}
    >
      <div className="flex items-center flex-wrap h-full gap-y-2 *:border-none! *:rounded-none">
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

        <LinkButtonToolbar editor={editor} />
      </div>
    </div>
  );
};
