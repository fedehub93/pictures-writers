import { useEditorState, type Editor } from "@tiptap/react";

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";

import { MarkButton } from "@/components/tiptap-editor/mark-button";

import { removeLinkMark, setLinkMark } from "../helpers";
import { Link } from "lucide-react";

export const LinkButtonToolbar = ({ editor }: { editor: Editor }) => {
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

  if (!editor || !editorState) return null;

  const handleLinkSave = (data: {
    text: string;
    target: string;
    follow: boolean;
  }) => {
    const { target, follow } = data;

    setLinkMark(editor, { href: target });
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .updateAttributes("link", { nofollow: !follow });

    setTimeout(() => {
      editor.chain().focus().run();
    }, 1);
  };

  const onClickLink = () => {
    if (editorState.isLink) return removeLinkMark(editor);

    onOpen("editLink", handleLinkSave, {
      text: "",
      target: "",
      follow: false,
    });
  };

  return (
    <MarkButton
      onClick={onClickLink}
      isActive={editorState.isLink}
      Icon={Link}
    />
  );
};
