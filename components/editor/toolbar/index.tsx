"use client";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Italic,
  Underline,
} from "lucide-react";

import { Separator } from "@/components/ui/separator";
import MarkButton from "./mark-button";
import BlockButton from "./block-button";
import { SelectHeading } from "./select-heading";

const heading = [
  {
    label: "Normal text",
    type: "paragraph",
    default: true,
  },
  {
    label: "Heading one",
    type: "heading-one",
  },
];

const Toolbar = () => {
  return (
    <div className="border rounded-t-md p-4">
      <div className="flex gap-x-1 h-9">
        <SelectHeading values={heading} />
        <MarkButton format="bold">
          <Bold className="h-4 w-4" />
        </MarkButton>
        <MarkButton format="italic">
          <Italic className="h-4 w-4" />
        </MarkButton>
        <MarkButton format="underline">
          <Underline className="h-4 w-4" />
        </MarkButton>
        <Separator orientation="vertical" />
        <BlockButton format="left">
          <AlignLeft className="h-4 w-4" />
        </BlockButton>
        <BlockButton format="center">
          <AlignCenter className="h-4 w-4" />
        </BlockButton>
        <BlockButton format="right">
          <AlignRight className="h-4 w-4" />
        </BlockButton>
        <BlockButton format="heading-one">
          <Heading1 className="h-4 w-4" />
        </BlockButton>
      </div>
    </div>
  );
};

export default Toolbar;
