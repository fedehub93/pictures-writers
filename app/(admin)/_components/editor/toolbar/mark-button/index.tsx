"use client";

import { useSlate } from "slate-react";

import { Toggle } from "@/components/ui/toggle";
import { CustomEditorHelper } from "../../utils/custom-editor";

interface MarkButtonProps {
  children: React.ReactNode;
  format: "bold" | "italic" | "underline";
}

const MarkButton = ({ children, format }: MarkButtonProps) => {
  const editor = useSlate();

  const isActive = CustomEditorHelper.isMarkActive(editor, format);

  return (
    <Toggle
      size="sm"
      pressed={isActive}
      onPressedChange={() => CustomEditorHelper.toggleMark(editor, format)}
      aria-label={`Toggle ${format}`}
    >
      {children}
    </Toggle>
  );
};

export default MarkButton;
