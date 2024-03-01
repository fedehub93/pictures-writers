"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Underline,
} from "lucide-react";

import { Separator } from "@/components/ui/separator";
import MarkButton from "./mark-button";
import BlockButton from "./block-button";
import { SelectHeading } from "./select-heading";
import LinkButton from "./link-button";
import { Button } from "@/components/ui/button";
import { useModal } from "@/app/(admin)/_hooks/use-modal-store";

const Toolbar = () => {
  const { onOpen } = useModal();

  return (
    <div className="border rounded-t-md p-4">
      <div className="flex gap-x-1 h-9">
        <SelectHeading />
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
        <LinkButton format="link" />
        <Separator orientation="vertical" />
        <BlockButton format="left" blockType="align">
          <AlignLeft className="h-4 w-4" />
        </BlockButton>
        <BlockButton format="center" blockType="align">
          <AlignCenter className="h-4 w-4" />
        </BlockButton>
        <BlockButton format="right" blockType="align">
          <AlignRight className="h-4 w-4" />
        </BlockButton>
        <Separator orientation="vertical" />
        <BlockButton format="bulleted-list">
          <List className="h-4 w-4" />
        </BlockButton>
        <BlockButton format="numbered-list">
          <ListOrdered className="h-4 w-4" />
        </BlockButton>
        <BlockButton format="block-quote">
          <Quote className="h-4 w-4" />
        </BlockButton>
        <Button
          type="button"
          onClick={() => onOpen("selectAsset")}
          variant="outline"
          className="ml-auto"
        >
          Insert Embed
        </Button>
      </div>
    </div>
  );
};

export default Toolbar;
