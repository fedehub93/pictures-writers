"use client";

import { Element } from "slate";
import { useSlate } from "slate-react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";
import { CustomElementType } from "@/components/editor";
import { CustomEditorHelper } from "@/components/editor/utils/custom-editor";
import { useMemo } from "react";

type Heading = {
  label: string;
  type: CustomElementType;
  className?: string;
  default?: boolean;
};

export const SelectHeading = () => {
  const editor = useSlate();

  const { selection } = editor;

  const values: Heading[] = useMemo<Heading[]>(
    () => [
      {
        label: "Normal text",
        type: "paragraph",
        default: true,
      },
      {
        label: "Heading one",
        type: "heading-one",
        className: "text-3xl",
      },
      {
        label: "Heading two",
        type: "heading-two",
        className: "text-2xl",
      },
      {
        label: "Heading three",
        type: "heading-three",
        className: "text-xl",
      },
      {
        label: "Heading four",
        type: "heading-four",
        className: "text-lg",
      },
    ],
    []
  );

  const defaultSelectValue = values.find((value) => value.default) || {
    label: "Normal Text",
    type: "paragraph",
  };

  let selected = null;
  if (selection !== null && selection.anchor !== null) {
    const e = editor.children[selection.anchor.path[0]];
    selected = Element.isElement(e) ? e : null;
  } else {
    selected = null;
  }

  const onValueChange = (value: CustomElementType) => {
    if (!value) return;
    CustomEditorHelper.toggleBlock(editor, value);
  };

  return (
    <Select
      value={selected?.type || defaultSelectValue.type}
      onValueChange={onValueChange}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Headers</SelectLabel>
          {values.map((value) => (
            <SelectItem
              key={value.label}
              value={value.type}
              className={cn(value.className)}
            >
              {value.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
