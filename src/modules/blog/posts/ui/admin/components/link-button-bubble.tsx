"use client";

import "client-only";

import { Link } from "lucide-react";
import { useEditorState } from "@tiptap/react";

// NOTE: this admin/blog component uses the admin modal store, mirroring the
// existing toolbar link button. Decoupling the modal store from admin hooks
// would require moving it to shared code; that refactor is out of scope here.
import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { MarkButton } from "@/shared/components/tiptap-editor/mark-button";
import type { LinkButtonBubbleProps } from "@/shared/components/tiptap-editor/bubble-menu/bubble-menu";
import {
  removeLinkMark,
  setLinkMark,
  updateLinkMark,
} from "@/shared/components/tiptap-editor/extensions/link/helpers";

export const LinkButtonBubble = ({ editor }: LinkButtonBubbleProps) => {
  const { onOpen } = useModal();

  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) {
        return { isLink: false };
      }

      return { isLink: editor.isActive("link") };
    },
  });

  if (!editorState) return null;

  const onClickLink = () => {
    if (editorState.isLink) {
      return removeLinkMark(editor);
    }

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");

    onOpen(
      "editLink",
      (data: { text: string; target: string; follow: boolean }) => {
        const { target, follow } = data;

        editor.chain().focus().setTextSelection({ from, to }).run();

        if (editor.isActive("link")) {
          updateLinkMark(editor, { href: target, nofollow: !follow });
        } else {
          setLinkMark(editor, { href: target, nofollow: !follow });
        }
      },
      {
        text: selectedText,
        target: "",
        follow: false,
      },
    );
  };

  return (
    <MarkButton
      onClick={onClickLink}
      isActive={editorState.isLink}
      Icon={Link}
      label={editorState.isLink ? "Edit link" : "Add link"}
    />
  );
};
