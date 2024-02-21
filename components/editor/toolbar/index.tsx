"use client";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Underline,
} from "lucide-react";
import { useSlate } from "slate-react";

import { Toggle } from "@/components/ui/toggle";
import { CustomEditorHelper } from "@/components/editor/utils/custom-editor";
import { Separator } from "@/components/ui/separator";

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
    <div className="border rounded-t-md p-4">
      <div className="flex gap-x-1 h-9">
        <Toggle
          size="sm"
          pressed={isActiveBold}
          onPressedChange={() => CustomEditorHelper.toggleMark(editor, "bold")}
          aria-label="Toggle bold"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={isActiveItalic}
          onPressedChange={() =>
            CustomEditorHelper.toggleMark(editor, "italic")
          }
          aria-label="Toggle italic"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={isActiveUnderline}
          onPressedChange={() =>
            CustomEditorHelper.toggleMark(editor, "underline")
          }
          aria-label="Toggle underline"
        >
          <Underline className="h-4 w-4" />
        </Toggle>
        <Separator orientation="vertical" />
        <Toggle
          size="sm"
          pressed={isActiveLeftAlign}
          onPressedChange={() => CustomEditorHelper.toggleBlock(editor, "left")}
          aria-label="Toggle left"
        >
          <AlignLeft className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={isActiveCenterAlign}
          onPressedChange={() =>
            CustomEditorHelper.toggleBlock(editor, "center")
          }
          aria-label="Toggle center"
        >
          <AlignCenter className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
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
