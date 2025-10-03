"use client";

import React from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Box,
  ChevronDown,
  Info,
  Italic,
  Link,
  List,
  ListOrdered,
  LucideImage,
  Quote,
  Underline,
  Video,
} from "lucide-react";
import { Editor, useEditorState } from "@tiptap/react";

import { Media } from "@prisma/client";

import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";

import { HeadingSelect } from "./heading-select";
import { MarkButton } from "./mark-button";
import { LinkButtonToolbar } from "./extensions/link/ui/LinkButtonToolbar";
import { insertProduct } from "./extensions/product/helpers";
import { insertInfoBox } from "./extensions/info-box/helpers";

export interface MenuBarProps {
  editor: Editor | null;
  showEmbedButton?: boolean;
  sticky?: boolean;
  padding?: "none" | "xs" | "lg";
}

export const MenuBar = ({
  editor,
  showEmbedButton = true,
  sticky = false,
  padding = "lg",
}: MenuBarProps) => {
  const { onOpen } = useModal();
  // Stato derivato dall'editor, tipato in modo sicuro
  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) {
        return {
          isBold: false,
          isItalic: false,
          isUnderline: false,
          isLink: false,
          isBulletList: false,
          isOrderedList: false,
          isBlockquote: false,
          textAlign: null as "left" | "center" | "right" | "justify" | null,
        };
      }

      return {
        isBold: editor.isActive("bold"),
        isItalic: editor.isActive("italic"),
        isUnderline: editor.isActive("underline"),
        isLink: editor.isActive("link"),
        isBulletList: editor.isActive("bulletList"),
        isOrderedList: editor.isActive("orderedList"),
        isBlockquote: editor.isActive("blockquote"),
        textAlign: editor.isActive({ textAlign: "left" })
          ? "left"
          : editor.isActive({ textAlign: "center" })
          ? "center"
          : editor.isActive({ textAlign: "right" })
          ? "right"
          : editor.isActive({ textAlign: "justify" })
          ? "justify"
          : null,
      };
    },
  });

  if (!editor || !editorState) return null;

  // === Actions ===
  const onClickBold = () => {
    editor.chain().focus().toggleBold().run();
  };
  const onClickItalic = () => {
    editor.chain().focus().toggleItalic().run();
  };
  const onClickUnderline = () => {
    editor.chain().focus().toggleUnderline().run();
  };

  const getImage = (data: Media) => {
    editor
      .chain()
      .focus()
      .setImage({
        src: data.url,
        alt: data.altText || "image",
      })
      .run();
  };

  const getVideo = ({ url }: { url: string }) => {
    editor.commands.setYoutubeVideo({
      src: url,
    });
  };

  const getProduct = (data: any) => {
    insertProduct(editor, { rootId: data.rootId });
  };

  const insertInfoBoxNode = () => {
    insertInfoBox(editor);
  };

  // === Render ===
  return (
    <div
      className={cn(
        "bg-accent border rounded-t-md top-0 z-10 p-2 h-full flex flex-col space-y-4",
        padding === "xs" && "p-1",
        padding === "lg" && "p-4",
        sticky && "sticky"
      )}
    >
      <div className="flex items-center flex-wrap gap-x-1 h-full gap-y-2">
        <HeadingSelect editor={editor} />
        <Separator orientation="vertical" className="mx-2 !h-8" />

        <MarkButton
          onClick={onClickBold}
          isActive={editorState.isBold}
          Icon={Bold}
        />
        <MarkButton
          onClick={onClickItalic}
          isActive={editorState.isItalic}
          Icon={Italic}
        />
        <MarkButton
          onClick={onClickUnderline}
          isActive={editorState.isUnderline}
          Icon={Underline}
        />

        <Separator orientation="vertical" className="bg-slate-300 mx-2 !h-8" />

        <LinkButtonToolbar editor={editor} />

        <Separator orientation="vertical" className="bg-slate-300 mx-2 !h-8" />

        <MarkButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editorState.textAlign === "left"}
          Icon={AlignLeft}
        />
        <MarkButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editorState.textAlign === "center"}
          Icon={AlignCenter}
        />
        <MarkButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editorState.textAlign === "right"}
          Icon={AlignRight}
        />
        <MarkButton
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          isActive={editorState.textAlign === "justify"}
          Icon={AlignJustify}
        />

        <Separator orientation="vertical" className="bg-slate-300 mx-2 !h-8" />

        <MarkButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editorState.isBulletList}
          Icon={List}
        />
        <MarkButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editorState.isOrderedList}
          Icon={ListOrdered}
        />
        <MarkButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editorState.isBlockquote}
          Icon={Quote}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline">
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
            {/* <DropdownMenuItem
              onClick={() => onOpen("editLink", getAffiliateLink)}
            >
              <Link className="h-4 w-4 mr-2" />
              Affiliate link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={insertSponsorFirstImpression}>
              <Blocks className="h-4 w-4 mr-2" />
              Sponsor first impression
            </DropdownMenuItem> */}
            <DropdownMenuItem
              onClick={() => onOpen("selectProduct", getProduct)}
            >
              <Box className="h-4 w-4 mr-2" />
              Product
            </DropdownMenuItem>

            <DropdownMenuItem onClick={insertInfoBoxNode}>
              <Info className="h-4 w-4 mr-2" />
              Info box
            </DropdownMenuItem>
            {/* <DropdownMenuItem onClick={insertTable}>
                <Table className="h-4 w-4 mr-2" />
                Table
              </DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
