"use client";

import { Element } from "slate";
import { ReactEditor, useSlate } from "slate-react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import { CustomElementType } from "@/app/(admin)/_components/editor";
import { CustomEditorHelper } from "@/app/(admin)/_components/editor/utils/custom-editor";

type Heading = {
  label: string;
  type: CustomElementType;
  className?: string;
  default?: boolean;
};

const values: Heading[] = [
  {
    label: "Normal text",
    type: "paragraph",
    default: true,
  },
  {
    label: "Heading 1",
    type: "heading-1",
    className: "text-3xl",
  },
  {
    label: "Heading 2",
    type: "heading-2",
    className: "text-2xl",
  },
  {
    label: "Heading 3",
    type: "heading-3",
    className: "text-xl",
  },
  {
    label: "Heading 4",
    type: "heading-4",
    className: "text-lg",
  },
];

export const SelectHeading = () => {
  const editor = useSlate();

  const { selection } = editor;

  const defaultSelectValue = values.find((value) => value.default) || {
    label: "Normal Text",
    type: "paragraph",
  };

  let selected = null;
  if (selection !== null && selection.anchor !== null) {
    const e = editor.children[selection.anchor.path[0]];
    if (Element.isElement(e)) {
      const value = values.find((value) => value.type === e.type);
      selected = value ? value.label : defaultSelectValue.label;
    }
  } else {
    selected = defaultSelectValue.label;
  }

  const onValueChange = (value: CustomElementType) => {
    if (!value) return;
    CustomEditorHelper.toggleBlock(editor, value);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="bg-transparent hover:text-muted-foreground"
        >
          {selected}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup
          onValueChange={(value) => onValueChange(value as CustomElementType)}
        >
          {values.map((value) => (
            <DropdownMenuRadioItem
              key={value.label}
              value={value.type}
              className={cn(
                "pl-2 pr-4 h-9 font-medium cursor-pointer mb-1",
                value.className
              )}
            >
              {value.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
