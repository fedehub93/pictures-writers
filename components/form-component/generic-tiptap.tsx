import React from "react";
import { Control, FieldValues, Path, useController } from "react-hook-form";
import { useEditor } from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Youtube from "@tiptap/extension-youtube";

import { FormControl, FormField, FormItem } from "@/components/ui/form";

import { CustomLink } from "../tiptap-editor/extensions/link";
import { CustomImage } from "../tiptap-editor/extensions/image";
import { ProductNode } from "../tiptap-editor/extensions/product";
import { InfoBoxNode } from "../tiptap-editor/extensions/info-box";

import { cn } from "@/lib/utils";

import Tiptap from "../tiptap-editor";

interface GenericTiptapProps<T extends FieldValues> {
  id: string;
  control: Control<T>;
  name: Path<T>;
  containerProps?: React.HTMLAttributes<HTMLDivElement>;
  onUpdate?: () => void;
}

export const GenericTiptap = <T extends FieldValues>({
  id,
  control,
  name,
  containerProps,
  onUpdate,
  ...inputProps
}: GenericTiptapProps<T>) => {
  const { field } = useController({ control, name });
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
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
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      CustomLink.configure({ openOnClick: false }),
      CustomImage,
      Youtube.configure({
        nocookie: true,
      }),
      ProductNode,
      InfoBoxNode,
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

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-0">
          <FormControl>
            <Tiptap key={id} editor={editor} value={field.value} />
          </FormControl>
        </FormItem>
      )}
    />
  );
};
