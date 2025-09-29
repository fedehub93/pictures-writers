"use client";

import {
  ReactEditor,
  RenderElementProps,
  useSlate,
  useSlateStatic,
} from "slate-react";
import { Transforms } from "slate";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { X } from "lucide-react";

interface InfoBoxProps extends RenderElementProps {}

const emojiList = [
  "💡",
  "🏆",
  "📌",
  "⚠️",
  "✍️",
  "✅",
  "❓",
  "📖",
  "📨",
  "📩",
  "🔽",
  "1️⃣",
  "2️⃣",
  "3️⃣",
  "4️⃣",
  "5️⃣",
  "🎞️",
  "🔗",
  "🦸",
  "👿",
  "🧑‍🤝‍🧑",
]; // Lista di emoji personalizzata

export const InfoBox = ({ attributes, element, children }: InfoBoxProps) => {
  const editor = useSlateStatic();
  const path = ReactEditor.findPath(editor, element);

  const onEmojiSelect = (selectedEmoji: string) => {
    Transforms.setNodes(
      editor,
      { data: { icon: selectedEmoji } }, // Imposta la nuova emoji
      { at: path } // Specifica il path del nodo da aggiornare
    );
  };

  const onRemove = () => {
    Transforms.removeNodes(editor, { at: path });
  };

  return (
    <div
      {...attributes}
      className={cn(
        "relative mb-8 bg-background p-4 py-6 pl-12 rounded-lg [&>p]:mb-4",
        element.align === "left" && "text-left",
        element.align === "center" && "text-center",
        element.align === "right" && "text-right"
      )}
    >
      <Button
        size="icon"
        variant="ghost"
        className="absolute right-0 top-0"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            contentEditable={false}
            className="absolute top-3 left-2 text-lg"
          >
            {element.data.icon}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="grid grid-cols-4 gap-2">
            {emojiList.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onEmojiSelect(item)}
                className="text-lg p-2 hover:bg-gray-100 rounded"
              >
                {item}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {children}
    </div>
  );
};
