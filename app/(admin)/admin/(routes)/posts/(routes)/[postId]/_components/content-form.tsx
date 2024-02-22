"use client";

import { useMemo } from "react";

import Editor, { createWrappedEditor } from "@/components/editor";

export const ContentForm = () => {
  const editor = useMemo(() => createWrappedEditor(), []);
  return (
    <div>
      <Editor editor={editor} />
    </div>
  );
};
