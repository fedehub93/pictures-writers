import React, { useEffect } from "react";
import { Control, FieldValues, Path, useController } from "react-hook-form";
import { useEditor } from "@tiptap/react";
import type { Editor } from "@tiptap/core";

import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Youtube from "@tiptap/extension-youtube";

import { CustomLink } from "../tiptap-editor/extensions/link";
import { CustomImage } from "../tiptap-editor/extensions/image";
import { ProductNode } from "../tiptap-editor/extensions/product";
import { InfoBoxNode } from "../tiptap-editor/extensions/info-box";

import { cn } from "@/shared/lib/utils";

import Tiptap from "../tiptap-editor";
import { TableContentNode } from "../tiptap-editor/extensions/table-content";
import { CustomBold } from "../tiptap-editor/extensions/bold";
import { countWordsFromTiptap } from "../tiptap-renderer/helpers/words-counter";

interface GenericTiptapProps<T extends FieldValues> {
  id: string;
  control: Control<T>;
  name: Path<T>;
  onUpdate?: () => void;
  onEditorReady?: (editor: Editor | null) => void;
}

export const GenericTiptapV2 = <T extends FieldValues>({
  id,
  control,
  name,
  onUpdate,
  onEditorReady,
}: GenericTiptapProps<T>) => {
  const { field } = useController({ control, name });
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: false,
        heading: {
          levels: [1, 2, 3, 4],
        },
        link: false,
        blockquote: {
          HTMLAttributes: {
            class: "not-prose",
          },
        },
      }),
      CustomBold,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      CustomLink.configure({ openOnClick: false }),
      CustomImage,
      Youtube.configure({
        nocookie: true,
      }),
      ProductNode,
      InfoBoxNode,
      TableContentNode,
    ],
    content: field.value ?? "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(`!outline-0`),
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

  return <Tiptap key={id} editor={editor} value={field.value} />;
};
