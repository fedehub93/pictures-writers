"use client";

import "client-only";

import React, { useEffect, type ComponentType } from "react";
import { Control, FieldValues, Path, useController } from "react-hook-form";
import { useEditor } from "@tiptap/react";
import type { Editor } from "@tiptap/core";

import Tiptap from "../tiptap-editor";
import { createProductionExtensions } from "../tiptap-editor/lib/create-editor-extensions";
import type { LinkButtonBubbleProps } from "../tiptap-editor/bubble-menu/bubble-menu";
import type { SlashCommandModalService } from "../tiptap-editor/slash-menu/types";

interface GenericTiptapProps<T extends FieldValues> {
  id: string;
  control: Control<T>;
  name: Path<T>;
  onUpdate?: () => void;
  onEditorReady?: (editor: Editor | null) => void;
  toolbar?: boolean;
  bubbleMenu?: boolean;
  linkButton?: ComponentType<LinkButtonBubbleProps>;
  modalService?: SlashCommandModalService;
}

export const GenericTiptapV2 = <T extends FieldValues>({
  id,
  control,
  name,
  onUpdate,
  onEditorReady,
  toolbar = true,
  bubbleMenu = false,
  linkButton,
  modalService,
}: GenericTiptapProps<T>) => {
  const { field } = useController({ control, name });
  const editor = useEditor({
    extensions: createProductionExtensions(modalService),
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
    <Tiptap
      key={id}
      editor={editor}
      value={field.value}
      toolbar={toolbar}
      bubbleMenu={bubbleMenu}
      linkButton={linkButton}
    />
  );
};
