"use client";

import { EditorContent, Editor } from "@tiptap/react";

import { MenuBar } from "./menu-bar";

interface TiptapProps {
  editor: Editor | null;
  value: any;
}
const Tiptap = ({ editor, value }: TiptapProps) => {
  return (
    <div className="w-full max-w-full flex flex-col">
      <MenuBar editor={editor} sticky />
      <EditorContent
        editor={editor}
        className="max-w-full p-4 border border-t-0 prose rounded-b-lg"
      />
    </div>
  );
};

export default Tiptap;
