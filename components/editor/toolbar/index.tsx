"use client";

import { Media } from "@prisma/client";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Underline,
  Video,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ToolbarProps {
  showEmbedButton?: boolean;
}

const Toolbar = ({ showEmbedButton = true }: ToolbarProps) => {
  const { onOpen } = useModal();
  const editor = useSlate();

  const getImage = (data: Media) => {
    CustomEditorHelper.insertImage(editor, data.url, data.altText || "");
  };

  const getVideo = (url: string) => {
    CustomEditorHelper.insertVideo(editor, url || "");
  };

  const getAffiliateLink = ({ url, label }: { url: string; label: string }) => {
    CustomEditorHelper.insertAffiliateLink(editor, url || "", label || "");
  };

  return (
    <div className="border rounded-t-md p-4 bg-slate-100 dark:bg-secondary sticky top-0 z-10">
      <div className="flex flex-wrap gap-x-1">
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
        {showEmbedButton && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className="ml-auto">
                Insert Embed
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onOpen("selectAsset", getImage)}>
                <Image className="h-4 w-4 mr-2" />
                Image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpen("selectUrl", getVideo)}>
                <Video className="h-4 w-4 mr-2" />
                Video
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  onOpen("selectUrl", getAffiliateLink, { showLabel: true })
                }
              >
                <Link className="h-4 w-4 mr-2" />
                Affiliate link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
