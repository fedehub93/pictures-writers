import React, { useEffect } from "react";
import { Control, FieldValues, Path, useController } from "react-hook-form";
import { useEditor } from "@tiptap/react";
import type { Editor } from "@tiptap/core";

import Tiptap from "../tiptap-editor";
import { createProductionExtensions } from "../tiptap-editor/lib/create-editor-extensions";

interface GenericTiptapProps<T extends FieldValues> {
  id: string;
  control: Control<T>;
  name: Path<T>;
  onUpdate?: () => void;
  onEditorReady?: (editor: Editor | null) => void;
  toolbar?: boolean;
}

export const GenericTiptapV2 = <T extends FieldValues>({
  id,
  control,
  name,
  onUpdate,
  onEditorReady,
  toolbar = true,
}: GenericTiptapProps<T>) => {
  const { field } = useController({ control, name });
  const editor = useEditor({
    extensions: createProductionExtensions(),
    content: field.value ?? "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "!outline-0",
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      queueMicrotask(() => {
        field.onChange(json);
        if (onUpdate) onUpdate();
      });
    },
  });

  useEffect(() => {
    onEditorReady?.(editor);

    return () => {
      onEditorReady?.(null);
    };
  }, [editor, onEditorReady]);

  return (
    <Tiptap key={id} editor={editor} value={field.value} toolbar={toolbar} />
  );
};
