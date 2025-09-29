import React from "react";
import { Control, FieldValues, Path, useController } from "react-hook-form";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Heading from "@tiptap/extension-heading";
import { Link } from "@tiptap/extension-link";
import Blockquote from "@tiptap/extension-blockquote";

import { useEditor } from "@tiptap/react";

import { cn } from "@/lib/utils";

import { FormControl, FormField, FormItem } from "@/components/ui/form";

import Tiptap from "../tiptap-editor";

interface GenericTiptapProps<T extends FieldValues> {
  id: string;
  control: Control<T>;
  name: Path<T>;
  containerProps?: React.HTMLAttributes<HTMLDivElement>;
  onUpdate?: () => void;
}

export const CustomLink = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      rel: {
        default: null,
        parseHTML: (element) => element.getAttribute("rel"),
        renderHTML: (attributes) => {
          if (!attributes.rel) return {};
          return { rel: attributes.rel };
        },
      },
    };
  },
});

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
        link: {
          openOnClick: false,
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Heading.configure({ levels: [1, 2, 3, 4] }),
      Underline,
      CustomLink.configure({ openOnClick: false }),
      Blockquote.configure({
        HTMLAttributes: {
          class: "not-prose",
        },
      }),
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
      field.onChange(json);
      if (onUpdate) onUpdate();
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
