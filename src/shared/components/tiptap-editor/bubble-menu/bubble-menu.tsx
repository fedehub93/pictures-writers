"use client";

import "client-only";

import { useMemo, type ComponentType } from "react";
import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/react/menus";
import { Bold, Italic, Underline } from "lucide-react";
import { useEditorState, type Editor } from "@tiptap/react";

import { MarkButton } from "../mark-button";

import { shouldShowBubbleMenu } from "./bubble-menu-utils";

export interface LinkButtonBubbleProps {
  editor: Editor;
}

interface BubbleMenuProps {
  editor: Editor | null;
  linkButton?: ComponentType<LinkButtonBubbleProps>;
}

const BubbleMenuToolbar = ({ editor }: { editor: Editor }) => {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return null;

      return {
        isBold: editor.isActive("bold"),
        isItalic: editor.isActive("italic"),
        isUnderline: editor.isActive("underline"),
      };
    },
  });

  if (!state) return null;

  return (
    <>
      <MarkButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={state.isBold}
        Icon={Bold}
        label="Bold"
      />
      <MarkButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={state.isItalic}
        Icon={Italic}
        label="Italic"
      />
      <MarkButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={state.isUnderline}
        Icon={Underline}
        label="Underline"
      />
    </>
  );
};

export const BubbleMenu = ({ editor, linkButton: LinkButton }: BubbleMenuProps) => {
  const options = useMemo(
    () => ({
      placement: "top" as const,
      offset: 8,
      flip: true,
      shift: true,
      inline: true,
    }),
    [],
  );

  if (!editor) return null;

  return (
    <TiptapBubbleMenu
      editor={editor}
      shouldShow={shouldShowBubbleMenu}
      updateDelay={250}
      options={options}
      className="flex items-center gap-1 rounded-md border bg-background p-1 shadow-sm select-none"
      onPointerDown={(event) => event.preventDefault()}
      role="toolbar"
      aria-label="Inline formatting"
    >
      <BubbleMenuToolbar editor={editor} />
      {LinkButton && <LinkButton editor={editor} />}
    </TiptapBubbleMenu>
  );
};
