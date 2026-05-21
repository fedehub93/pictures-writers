"use client";

import { Element } from "slate";
import { useSlate } from "slate-react";
import { Link, Unlink } from "lucide-react";

import { Toggle } from "@/components/ui/toggle";
import { CustomEditorHelper } from "@/app/(admin)/_components/editor/utils/custom-editor";
import { useModal } from "@/app/(admin)/_hooks/use-modal-store";

interface LinkButtonProps {
  format: "hyperlink";
}

const LinkButton = ({ format }: LinkButtonProps) => {
  const editor = useSlate();

  const { onOpen } = useModal();

  const isActive = CustomEditorHelper.isBlockActive(editor, format);

  const handleSave = (values: {
    text: string;
    target: string;
    follow: boolean;
  }) => {
    if (!isActive) {
      if (!values.target) return;
      CustomEditorHelper.wrapLink(editor, {
        url: values.target,
        text: values.text,
        follow: values.follow,
      });
      return;
    }

    CustomEditorHelper.unwrapLink(editor);
  };

  const onPressedChange = () => {
    if (isActive) {
      return CustomEditorHelper.unwrapLink(editor);
    }
    const { selection } = editor;
    let selected = null;
    if (selection !== null && selection.anchor !== null) {
      const e = editor.children[selection.anchor.path[0]];
      selected = Element.isElement(e) ? e : null;
    } else {
      selected = null;
    }

    onOpen("editLink", handleSave, {
      text:
        !Element.isElement(selected?.children[0]) && selected?.children[0].text
          ? selected?.children[0].text
          : "",
      target: "",
      follow: false,
    });
  };

  return (
    <Toggle
      size="sm"
      pressed={isActive}
      onPressedChange={onPressedChange}
      aria-label={`Toggle ${format}`}
    >
      {isActive ? <Unlink className="h-4 w-4" /> : <Link className="h-4 w-4" />}
    </Toggle>
  );
};

export default LinkButton;
