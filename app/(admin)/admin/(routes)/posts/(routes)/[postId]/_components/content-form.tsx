"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import Editor from "@/components/editor";

import { createWrappedEditor } from "@/components/editor";

export const ContentForm = () => {
  const [editor] = useState(() => createWrappedEditor());
  return (
    <div>
      <Editor editor={editor} />
    </div>
  );
};
