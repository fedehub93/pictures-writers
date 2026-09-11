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
  List,
  ListOrdered,
  LucideImage,
  Quote,
  TableOfContents,
  Underline,
  Video,
} from "lucide-react";
import { Editor, useEditorState } from "@tiptap/react";

import { Media } from "@/generated/prisma";

import { Separator } from "@/shared/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Button } from "@/shared/ui/button";

import { cn } from "@/shared/lib/utils";

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";

import { HeadingSelect } from "./heading-select";
import { MarkButton } from "./mark-button";
import { LinkButtonToolbar } from "./extensions/link/ui/LinkButtonToolbar";
import { insertProduct } from "./extensions/product/helpers";
import { insertInfoBox } from "./extensions/info-box/helpers";
import { insertTableContent } from "./extensions/table-content/helpers";

export interface MenuBarProps {
  editor: Editor | null;
  sticky?: boolean;
  padding?: "none" | "xs" | "lg";
}

export const MenuBar = ({
  editor,
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

  const getProduct = (data: { rootId: string }) => {
    insertProduct(editor, { rootId: data.rootId });
  };

  const insertInfoBoxNode = () => {
    insertInfoBox(editor);
  };

  const insertTableContentNode = () => {
    insertTableContent(editor);
  };

  // === Render ===
  return (
    <div
      className={cn(
        "bg-accent border-b top-0 z-10 flex flex-wrap items-center gap-x-1 gap-y-1",
        padding === "xs" && "p-1",
        padding === "lg" && "p-3",
        sticky && "sticky",
      )}
    >
      <div className="flex items-center flex-wrap gap-x-1 gap-y-1">
        <HeadingSelect editor={editor} />
        <Separator orientation="vertical" className="mx-2 h-8!" />

        <MarkButton
          onClick={onClickBold}
          isActive={editorState.isBold}
          Icon={Bold}
          label="Bold"
        />
        <MarkButton
          onClick={onClickItalic}
          isActive={editorState.isItalic}
          Icon={Italic}
          label="Italic"
        />
        <MarkButton
          onClick={onClickUnderline}
          isActive={editorState.isUnderline}
          Icon={Underline}
          label="Underline"
        />

        <Separator orientation="vertical" className="bg-slate-300 mx-2 h-8!" />

        <LinkButtonToolbar editor={editor} />

        <Separator orientation="vertical" className="bg-slate-300 mx-2 h-8!" />

        <MarkButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editorState.textAlign === "left"}
          Icon={AlignLeft}
          label="Align left"
        />
        <MarkButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editorState.textAlign === "center"}
          Icon={AlignCenter}
          label="Align center"
        />
        <MarkButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editorState.textAlign === "right"}
          Icon={AlignRight}
          label="Align right"
        />
        <MarkButton
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          isActive={editorState.textAlign === "justify"}
          Icon={AlignJustify}
          label="Align justify"
        />

        <Separator orientation="vertical" className="bg-slate-300 mx-2 h-8!" />

        <MarkButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editorState.isBulletList}
          Icon={List}
          label="Bullet list"
        />
        <MarkButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editorState.isOrderedList}
          Icon={ListOrdered}
          label="Ordered list"
        />
        <MarkButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editorState.isBlockquote}
          Icon={Quote}
          label="Blockquote"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" size="sm" variant="outline">
              Embed
              <ChevronDown className="size-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onOpen("selectAsset", getImage)}>
              <LucideImage className="size-4 mr-2" />
              Image
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpen("selectUrl", getVideo)}>
              <Video className="size-4 mr-2" />
              Video
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onOpen("selectProduct", getProduct)}
            >
              <Box className="size-4 mr-2" />
              Product
            </DropdownMenuItem>

            <DropdownMenuItem onClick={insertInfoBoxNode}>
              <Info className="size-4 mr-2" />
              Info box
            </DropdownMenuItem>

            <DropdownMenuItem onClick={insertTableContentNode}>
              <TableOfContents className="size-4 mr-2" />
              Table of contents
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
