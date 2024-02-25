"use client";

import { useMemo } from "react";

import Editor from "@/components/editor";
import { createWrappedEditor } from "@/components/editor/editor-input";

export const ContentForm = () => {
  const editor = useMemo(() => createWrappedEditor(), []);
  return (
    <div className="h-full">
      <Editor editor={editor} />
    </div>
  );
};
