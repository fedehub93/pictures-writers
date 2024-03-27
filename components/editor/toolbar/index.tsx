"use client";

import { Media } from "@prisma/client";
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
import { useSlate } from "slate-react";

import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { CustomEditorHelper } from "@/components/editor/utils/custom-editor";

import MarkButton from "./mark-button";
import BlockButton from "./block-button";
import { SelectHeading } from "./select-heading";
import LinkButton from "./link-button";

const Toolbar = () => {
  const { onOpen } = useModal();
  const editor = useSlate();

  const getImage = (data: Media) => {
    CustomEditorHelper.insertImage(editor, data.url, data.altText || "");
  };

  return (
    <div className="border rounded-t-md p-4 bg-slate-100 dark:bg-secondary">
      <div className="flex gap-x-1 h-9">
        <SelectHeading />
        <Separator orientation="vertical" className="bg-slate-300" />
        <MarkButton format="bold">
          <Bold className="h-4 w-4" />
        </MarkButton>
        <MarkButton format="italic">
          <Italic className="h-4 w-4" />
        </MarkButton>
        <MarkButton format="underline">
          <Underline className="h-4 w-4" />
        </MarkButton>
        <Separator orientation="vertical" className="bg-slate-300" />
        <LinkButton format="link" />
        <Separator orientation="vertical" className="bg-slate-300" />
        <BlockButton format="left" blockType="align">
          <AlignLeft className="h-4 w-4" />
        </BlockButton>
        <BlockButton format="center" blockType="align">
          <AlignCenter className="h-4 w-4" />
        </BlockButton>
        <BlockButton format="right" blockType="align">
          <AlignRight className="h-4 w-4" />
        </BlockButton>
        <Separator orientation="vertical" className="bg-slate-300" />
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
          onClick={() => onOpen("selectAsset", getImage)}
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
