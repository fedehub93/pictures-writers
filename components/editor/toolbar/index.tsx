"use client";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Underline,
} from "lucide-react";

import { Toggle } from "@/components/ui/toggle";
import { CustomEditorHelper } from "../utils/custom-editor";
import { useSlate } from "slate-react";

const Toolbar = () => {
  const editor = useSlate();

  const isActiveBold = CustomEditorHelper.isMarkActive(editor, "bold");
  const isActiveItalic = CustomEditorHelper.isMarkActive(editor, "italic");
  const isActiveUnderline = CustomEditorHelper.isMarkActive(
    editor,
    "underline"
  );
  const isActiveLeftAlign = CustomEditorHelper.isBlockActive(
    editor,
    "left",
    "align"
  );
  const isActiveCenterAlign = CustomEditorHelper.isBlockActive(
    editor,
    "center",
    "align"
  );
  const isActiveRightAlign = CustomEditorHelper.isBlockActive(
    editor,
    "right",
    "align"
  );

  return (
    <div className="border rounded-md p-4">
      <div className="flex gap-x-1">
        <Toggle
          variant="outline"
          pressed={isActiveBold}
          onPressedChange={() => CustomEditorHelper.toggleMark(editor, "bold")}
          aria-label="Toggle bold"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          variant="outline"
          pressed={isActiveItalic}
          onPressedChange={() =>
            CustomEditorHelper.toggleMark(editor, "italic")
          }
          aria-label="Toggle italic"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          variant="outline"
          pressed={isActiveUnderline}
          onPressedChange={() =>
            CustomEditorHelper.toggleMark(editor, "underline")
          }
          aria-label="Toggle underline"
        >
          <Underline className="h-4 w-4" />
        </Toggle>
        <Toggle
          variant="outline"
          pressed={isActiveLeftAlign}
          onPressedChange={() => CustomEditorHelper.toggleBlock(editor, "left")}
          aria-label="Toggle left"
        >
          <AlignLeft className="h-4 w-4" />
        </Toggle>
        <Toggle
          variant="outline"
          pressed={isActiveCenterAlign}
          onPressedChange={() =>
            CustomEditorHelper.toggleBlock(editor, "center")
          }
          aria-label="Toggle center"
        >
          <AlignCenter className="h-4 w-4" />
        </Toggle>
        <Toggle
          variant="outline"
          pressed={isActiveRightAlign}
          onPressedChange={() =>
            CustomEditorHelper.toggleBlock(editor, "right")
          }
          aria-label="Toggle right"
        >
          <AlignRight className="h-4 w-4" />
        </Toggle>
      </div>
    </div>
  );
};

export default Toolbar;
