"use client";

import { EditorContent, Editor } from "@tiptap/react";

import { MenuBar } from "./menu-bar";

interface TiptapProps {
  editor: Editor | null;
  value: unknown;
  toolbar?: boolean;
}

const Tiptap = ({ editor, value: _value, toolbar = true }: TiptapProps) => {
  return (
    <div className="w-full max-w-full flex flex-col">
      {toolbar && <MenuBar editor={editor} sticky padding="xs" />}
      <EditorContent
        editor={editor}
        className="max-w-full p-4 prose rounded-b-lg min-h-[12rem]"
      />
    </div>
  );
};

export default Tiptap;
