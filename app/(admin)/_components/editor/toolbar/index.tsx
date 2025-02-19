"use client";

import { Media } from "@prisma/client";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Blocks,
  Bold,
  Box,
  ChevronDown,
  Image as LucideImage,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Underline,
  Video,
  Info,
  Table,
} from "lucide-react";
import { useSlate } from "slate-react";

import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { CustomEditorHelper } from "@/app/(admin)/_components/editor/utils/custom-editor";

import MarkButton from "./mark-button";
import BlockButton from "./block-button";
import { SelectHeading } from "./select-heading";
import LinkButton from "./link-button";

interface ToolbarProps {
  showEmbedButton?: boolean;
  sticky?: boolean;
  padding?: "none" | "xs" | "lg";
}

const Toolbar = ({
  showEmbedButton = true,
  sticky = false,
  padding = "lg",
}: ToolbarProps) => {
  const { onOpen } = useModal();
  const editor = useSlate();

  const getImage = (data: Media) => {
    CustomEditorHelper.insertImage(editor, data.url, data.altText || "");
  };

  const getVideo = ({ url }: { url: string }) => {
    CustomEditorHelper.insertVideo(editor, url || "");
  };

  const getAffiliateLink = ({
    target,
    text,
  }: {
    target: string;
    text: string;
  }) => {
    CustomEditorHelper.insertAffiliateLink(editor, target || "", text || "");
  };

  const insertSponsorFirstImpression = () => {
    CustomEditorHelper.insertSponsorFirstImpression(editor);
  };

  const getProduct = (data: any) => {
    CustomEditorHelper.insertProduct(editor, { ...data });
  };

  const insertInfoBox = () => {
    CustomEditorHelper.insertInfoBox(editor, {});
  };
  // const insertTable = () => {
  //   CustomEditorHelper.insertTable(editor);
  // };

  return (
    <div
      className={cn(
        "border rounded-t-md bg-slate-100 dark:bg-secondary top-0 z-10",
        padding === "xs" && "p-1",
        padding === "lg" && "p-4",
        sticky && "sticky"
      )}
    >
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
        <LinkButton format="hyperlink" />
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
        <BlockButton format="unordered-list">
          <List className="h-4 w-4" />
        </BlockButton>
        <BlockButton format="ordered-list">
          <ListOrdered className="h-4 w-4" />
        </BlockButton>
        <BlockButton format="blockquote">
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
                <LucideImage className="h-4 w-4 mr-2" />
                Image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpen("selectUrl", getVideo)}>
                <Video className="h-4 w-4 mr-2" />
                Video
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onOpen("editLink", getAffiliateLink)}
              >
                <Link className="h-4 w-4 mr-2" />
                Affiliate link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={insertSponsorFirstImpression}>
                <Blocks className="h-4 w-4 mr-2" />
                Sponsor first impression
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onOpen("selectProduct", getProduct)}
              >
                <Box className="h-4 w-4 mr-2" />
                Product
              </DropdownMenuItem>
              <DropdownMenuItem onClick={insertInfoBox}>
                <Info className="h-4 w-4 mr-2" />
                Info box
              </DropdownMenuItem>
              {/* <DropdownMenuItem onClick={insertTable}>
                <Table className="h-4 w-4 mr-2" />
                Table
              </DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
