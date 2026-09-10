"use client";

import { EditorContent, Editor } from "@tiptap/react";
import type { ComponentType } from "react";

import { MenuBar } from "./menu-bar";
import {
  BubbleMenu,
  type LinkButtonBubbleProps,
} from "./bubble-menu/bubble-menu";
import { WritingMetrics } from "./writing-metrics";

interface TiptapProps {
  editor: Editor | null;
  value: unknown;
  toolbar?: boolean;
  bubbleMenu?: boolean;
  linkButton?: ComponentType<LinkButtonBubbleProps>;
}

const Tiptap = ({
  editor,
  value: _value,
  toolbar = true,
  bubbleMenu = false,
  linkButton,
}: TiptapProps) => {
  return (
    <div className="w-full max-w-full flex flex-col">
      {toolbar && <MenuBar editor={editor} sticky padding="xs" />}
      <EditorContent
        editor={editor}
        className="max-w-full p-4 prose rounded-b-lg min-h-[12rem]"
      />
      {bubbleMenu && <BubbleMenu editor={editor} linkButton={linkButton} />}
      <WritingMetrics editor={editor} />
    </div>
  );
};

export default Tiptap;
