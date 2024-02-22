"use client";

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

import { CustomEditorHelper } from "@/components/editor/utils/custom-editor";
import { CustomElementType } from "@/components/editor";
import { Editor, Element, NodeEntry, select } from "slate";
import { useEffect } from "react";

type HeadingValues = {
  label: string;
  type: CustomElementType;
  default?: boolean;
};

interface SelectHeadingProps {
  children: React.ReactNode;
  values: HeadingValues[];
}

export const SelectHeading = ({ children, values }: SelectHeadingProps) => {
  const editor = useSlate();

  const { selection } = editor;

  const defaultSelectValue =
    values.find((value) => value.default) || "paragraph";

  let selected = null;
  if (selection !== null && selection.anchor !== null) {
    selected = editor.children[selection.anchor.path[0]];
  } else {
    selected = null;
  }

  return (
    <Select value={selected?.type || defaultSelectValue}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Headers</SelectLabel>
          {values.map((value) => (
            <SelectItem key={value.label} value={value.type}>
              {value.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
