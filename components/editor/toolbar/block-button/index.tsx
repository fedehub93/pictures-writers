"use client";

import { useSlate } from "slate-react";

import { Toggle } from "@/components/ui/toggle";
import { CustomEditorHelper } from "../../utils/custom-editor";
import { CustomElementType } from "../..";

interface BlockButtonProps {
  children: React.ReactNode;
  format: CustomElementType;
}

const MarkButton = ({ children, format }: BlockButtonProps) => {
  const editor = useSlate();
  const isActive = CustomEditorHelper.isBlockActive(editor, format);

  return (
    <Toggle
      size="sm"
      pressed={isActive}
      onPressedChange={() => CustomEditorHelper.toggleBlock(editor, format)}
      aria-label={`Toggle ${format}`}
    >
      {children}
    </Toggle>
  );
};

export default MarkButton;
