"use client";

import { useSlate } from "slate-react";

import { Toggle } from "@/components/ui/toggle";
import { CustomEditorHelper } from "../../utils/custom-editor";
import { Link, Unlink } from "lucide-react";
import { useState } from "react";
import { EditLinkModal } from "@/app/(admin)/_components/modals/edit-link-modal";
import { Element } from "slate";

interface LinkButtonProps {
  format: "link";
}

const LinkButton = ({ format }: LinkButtonProps) => {
  const editor = useSlate();

  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<{
    text: string;
    target: string;
  }>({ text: "", target: "" });

  const isActive = CustomEditorHelper.isBlockActive(editor, format);

  const handleSave = (values: { text: string; target: string }) => {
    if (!isActive) {
      if (!values.target) return;
      CustomEditorHelper.wrapLink(editor, values.target, values.text);
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
    setData({ text: selected?.children[0].text || "", target: "" });
    setIsOpen(true);
  };

  return (
    <>
      <Toggle
        size="sm"
        pressed={isActive}
        onPressedChange={onPressedChange}
        aria-label={`Toggle ${format}`}
      >
        {isActive ? (
          <Unlink className="h-4 w-4" />
        ) : (
          <Link className="h-4 w-4" />
        )}
      </Toggle>
      <EditLinkModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
        onSave={handleSave}
        initialValues={data}
      />
    </>
  );
};

export default LinkButton;
