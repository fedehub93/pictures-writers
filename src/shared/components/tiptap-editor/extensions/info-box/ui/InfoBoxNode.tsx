"use client";

import {
  NodeViewWrapper,
  NodeViewContent,
  NodeViewRendererProps,
} from "@tiptap/react";
import { X } from "lucide-react";

import { Button } from "@/shared/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover";

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
];

export const InfoBoxBlock = ({
  node,
  editor,
  getPos,
}: NodeViewRendererProps) => {
  const { icon } = node.attrs;
  const { view } = editor;

  const onEmojiSelect = (emoji: string) => {
    if (typeof getPos === "function") {
      const position = getPos();
      if (position) {
        view.dispatch(
          view.state.tr.setNodeMarkup(position, undefined, {
            icon: emoji,
          })
        );
      }
    }
  };

  return (
    <NodeViewWrapper
      className={`relative mb-8 p-4 py-6 pl-12 rounded-lg [&>p]:mb-4 bg-accent`}
    >
      {/* Popover per selezione emoji */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="absolute top-3 left-2 text-lg"
          >
            {icon}
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

      {/* Qui Tiptap renderizza i figli (paragrafi, testo, ecc) */}
      <NodeViewContent className="mt-2" />
    </NodeViewWrapper>
  );
};
