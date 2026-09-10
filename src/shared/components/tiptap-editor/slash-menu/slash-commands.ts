import {
  Box,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Image as ImageIcon,
  Info,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Video,
} from "lucide-react";

import { DEFAULT_INFO_BOX_ICON } from "../extensions/info-box";

import type {
  SlashCommand,
  SlashCommandGroup,
  SlashCommandModalService,
} from "./types";
import { noOpSlashCommandModalService } from "./modal-service";

export const slashCommandGroups: Record<SlashCommandGroup, string> = {
  text: "Text",
  media: "Media",
  content: "Content",
};

export const createSlashCommands = (
  modalService: SlashCommandModalService = noOpSlashCommandModalService,
): SlashCommand[] => [
  {
    id: "paragraph",
    label: "Paragraph",
    description: "Plain text block",
    keywords: ["text", "normal", "p"],
    group: "text",
    icon: Pilcrow,
    execute: (editor, range) =>
      editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    id: "heading-1",
    label: "Heading 1",
    description: "Large section heading",
    keywords: ["h1", "title", "header"],
    group: "text",
    icon: Heading1,
    execute: (editor, range) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleHeading({ level: 1 })
        .run(),
  },
  {
    id: "heading-2",
    label: "Heading 2",
    description: "Medium section heading",
    keywords: ["h2", "title", "header"],
    group: "text",
    icon: Heading2,
    execute: (editor, range) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleHeading({ level: 2 })
        .run(),
  },
  {
    id: "heading-3",
    label: "Heading 3",
    description: "Small section heading",
    keywords: ["h3", "title", "header"],
    group: "text",
    icon: Heading3,
    execute: (editor, range) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleHeading({ level: 3 })
        .run(),
  },
  {
    id: "heading-4",
    label: "Heading 4",
    description: "Tiny section heading",
    keywords: ["h4", "title", "header"],
    group: "text",
    icon: Heading4,
    execute: (editor, range) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleHeading({ level: 4 })
        .run(),
  },
  {
    id: "bullet-list",
    label: "Bullet list",
    description: "Create a bulleted list",
    keywords: ["list", "unordered", "ul"],
    group: "text",
    icon: List,
    execute: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    id: "ordered-list",
    label: "Ordered list",
    description: "Create a numbered list",
    keywords: ["list", "numbered", "ol"],
    group: "text",
    icon: ListOrdered,
    execute: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    id: "blockquote",
    label: "Blockquote",
    description: "Quote text",
    keywords: ["quote", "citation"],
    group: "text",
    icon: Quote,
    execute: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    id: "code-block",
    label: "Code block",
    description: "Format as code",
    keywords: ["code", "preformatted"],
    group: "text",
    icon: Code,
    execute: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    id: "divider",
    label: "Divider",
    description: "Horizontal rule",
    keywords: ["hr", "separator", "line"],
    group: "text",
    icon: Minus,
    execute: (editor, range) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    id: "image",
    label: "Image",
    description: "Insert an image from the media library",
    keywords: ["img", "photo", "picture"],
    group: "media",
    icon: ImageIcon,
    execute: (editor, range) => {
      const deleted = editor.chain().focus().deleteRange(range).run();
      if (!deleted) return false;

      const insertPos = range.from;
      modalService.openImagePicker((image) => {
        editor
          .chain()
          .focus()
          .insertContentAt(insertPos, {
            type: "image",
            attrs: { src: image.src, alt: image.alt },
          })
          .run();
      });
      return true;
    },
  },
  {
    id: "video",
    label: "Video",
    description: "Insert a YouTube video",
    keywords: ["youtube", "embed"],
    group: "media",
    icon: Video,
    execute: (editor, range) => {
      const deleted = editor.chain().focus().deleteRange(range).run();
      if (!deleted) return false;

      const insertPos = range.from;
      modalService.openVideoUrlPicker((video) => {
        editor
          .chain()
          .focus()
          .insertContentAt(insertPos, {
            type: "youtube",
            attrs: { src: video.src },
          })
          .run();
      });
      return true;
    },
  },
  {
    id: "product",
    label: "Product",
    description: "Insert a product card",
    keywords: ["shop", "item"],
    group: "content",
    icon: Box,
    execute: (editor, range) => {
      const deleted = editor.chain().focus().deleteRange(range).run();
      if (!deleted) return false;

      const insertPos = range.from;
      modalService.openProductPicker((product) => {
        editor
          .chain()
          .focus()
          .insertContentAt(insertPos, {
            type: "product",
            attrs: { productRootId: product.productRootId },
          })
          .run();
      });
      return true;
    },
  },
  {
    id: "info-box",
    label: "Info box",
    description: "Insert a callout box",
    keywords: ["callout", "tip", "note"],
    group: "content",
    icon: Info,
    execute: (editor, range) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertInfoBox({ icon: DEFAULT_INFO_BOX_ICON })
        .run(),
  },
];

/**
 * Default catalog using the no-op modal service.
 */
export const slashCommands = createSlashCommands();

/**
 * Filters the slash command catalog by label, description and keywords.
 * An empty query returns the full catalog.
 */
export const filterSlashCommands = (
  commands: SlashCommand[],
  query: string,
): SlashCommand[] => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return commands;

  return commands.filter((command) => {
    const haystack = [
      command.label,
      command.description,
      ...command.keywords,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
};

/**
 * Groups a flat list of commands preserving their order.
 */
export const groupSlashCommands = (
  commands: SlashCommand[],
): [SlashCommandGroup, SlashCommand[]][] => {
  const groups = new Map<SlashCommandGroup, SlashCommand[]>();

  for (const command of commands) {
    const existing = groups.get(command.group) ?? [];
    existing.push(command);
    groups.set(command.group, existing);
  }

  // Preserve the order in which groups first appear in the input.
  const ordered: SlashCommandGroup[] = [];
  for (const command of commands) {
    if (!ordered.includes(command.group)) {
      ordered.push(command.group);
    }
  }

  return ordered.map((group) => [group, groups.get(group) ?? []]);
};
