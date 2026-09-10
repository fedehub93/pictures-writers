// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { Editor, type JSONContent } from "@tiptap/core";

import { countWordsFromTiptap } from "@/shared/components/tiptap-renderer/helpers/words-counter";

import {
  createProductionExtensions,
  TIPTAP_PLACEHOLDER,
} from "./create-editor-extensions";
import {
  filterSlashCommands,
  slashCommands,
} from "../slash-menu/slash-commands";
import {
  executeSlashCommand,
  isSlashMenuAllowed,
} from "../slash-menu/slash-menu-extension";
import type { SlashCommand } from "../slash-menu/types";

describe("Tiptap production editor seam", () => {
  it("preserves persisted custom nodes and their attributes", () => {
    const persisted = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello world" }],
        },
        {
          type: "image",
          attrs: {
            src: "https://example.com/img.jpg",
            alt: "example",
          },
        },
        {
          type: "youtube",
          attrs: { src: "https://youtube.com/watch?v=abc" },
        },
        {
          type: "product",
          attrs: { productRootId: "prod-123" },
        },
        {
          type: "infobox",
          attrs: { icon: "🔥" },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Info" }],
            },
          ],
        },
        {
          type: "tablecontent",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "TOC item" }],
            },
          ],
        },
      ],
    };

    const editor = new Editor({
      extensions: createProductionExtensions(),
      content: persisted,
    });

    const json = editor.getJSON();
    expect(json.content).toHaveLength(6);
    expect(json.content?.[1].attrs).toMatchObject({
      src: "https://example.com/img.jpg",
      alt: "example",
    });
    expect(json.content?.[2].attrs).toMatchObject({
      src: "https://youtube.com/watch?v=abc",
    });
    expect(json.content?.[3].attrs).toMatchObject({
      productRootId: "prod-123",
    });
    expect(json.content?.[4].attrs).toMatchObject({ icon: "🔥" });
    expect(json.content?.[5].type).toBe("tablecontent");
  });

  it("reports an empty document as empty and configures the placeholder", () => {
    const editor = new Editor({
      extensions: createProductionExtensions(),
      content: { type: "doc", content: [] },
    });

    expect(editor.isEmpty).toBe(true);

    const placeholderExtension = editor.extensionManager.extensions.find(
      (extension) => extension.name === "placeholder",
    );
    expect(placeholderExtension).toBeDefined();
    expect(
      placeholderExtension?.options.placeholder({
        editor,
        node: editor.state.schema.nodes.paragraph.create(),
      }),
    ).toBe(TIPTAP_PLACEHOLDER);
  });

  it("shows the placeholder on empty paragraphs even when the document is not empty", () => {
    const editor = new Editor({
      extensions: createProductionExtensions(),
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hello" }],
          },
          { type: "paragraph", content: [] },
        ],
      },
    });

    expect(editor.isEmpty).toBe(false);

    const placeholderExtension = editor.extensionManager.extensions.find(
      (extension) => extension.name === "placeholder",
    );
    expect(placeholderExtension).toBeDefined();
    expect(
      placeholderExtension?.options.placeholder({
        editor,
        node: editor.state.schema.nodes.paragraph.create(),
      }),
    ).toBe(TIPTAP_PLACEHOLDER);
  });

  it("shows a node-specific placeholder for empty headings", () => {
    const editor = new Editor({
      extensions: createProductionExtensions(),
      content: { type: "doc", content: [] },
    });

    const placeholderExtension = editor.extensionManager.extensions.find(
      (extension) => extension.name === "placeholder",
    );
    expect(placeholderExtension).toBeDefined();

    for (const level of [1, 2, 3, 4]) {
      expect(
        placeholderExtension?.options.placeholder({
          editor,
          node: editor.state.schema.nodes.heading.create({ level }),
        }),
      ).toBe(`Heading ${level}`);
    }
  });

  it("derives word count from the document", () => {
    const editor = new Editor({
      extensions: createProductionExtensions(),
      content: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Two words" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "Three more words" }],
          },
        ],
      },
    });

    expect(countWordsFromTiptap(editor.getJSON())).toBe(5);
  });

  it("transforms a paragraph into a heading without losing text", () => {
    const editor = new Editor({
      extensions: createProductionExtensions(),
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Becomes a heading" }],
          },
        ],
      },
    });

    editor.chain().focus().toggleHeading({ level: 2 }).run();

    const json: JSONContent = editor.getJSON();
    expect(json.content?.[0].type).toBe("heading");
    expect(json.content?.[0].attrs?.level).toBe(2);
    expect(json.content?.[0].content?.[0].text).toBe("Becomes a heading");
  });

  describe("slash menu", () => {
    const findCommand = (id: string): SlashCommand => {
      const command = slashCommands.find((cmd) => cmd.id === id);
      if (!command) throw new Error(`Missing slash command: ${id}`);
      return command;
    };

    it("catalog exposes text, media and content commands and excludes tablecontent", () => {
      const ids = slashCommands.map((cmd) => cmd.id);

      expect(ids).toEqual([
        "paragraph",
        "heading-1",
        "heading-2",
        "heading-3",
        "heading-4",
        "bullet-list",
        "ordered-list",
        "blockquote",
        "code-block",
        "divider",
        "image",
        "video",
        "product",
        "info-box",
      ]);

      expect(ids).not.toContain("tablecontent");
    });

    it("filters commands by label, description and keywords", () => {
      expect(filterSlashCommands(slashCommands, "")).toHaveLength(
        slashCommands.length,
      );

      expect(filterSlashCommands(slashCommands, "heading").map((c) => c.id)).toEqual([
        "heading-1",
        "heading-2",
        "heading-3",
        "heading-4",
      ]);

      expect(filterSlashCommands(slashCommands, "h2").map((c) => c.id)).toEqual([
        "heading-2",
      ]);

      expect(filterSlashCommands(slashCommands, "numbered").map((c) => c.id)).toEqual([
        "ordered-list",
      ]);

      expect(filterSlashCommands(slashCommands, "quote").map((c) => c.id)).toEqual([
        "blockquote",
      ]);

      expect(filterSlashCommands(slashCommands, "xyz")).toHaveLength(0);
    });

    it("removes the slash query before inserting a heading", () => {
      const editor = new Editor({
        extensions: createProductionExtensions(),
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "/heading Hello" }],
            },
          ],
        },
      });

      // `/heading` spans positions 1-9 inside the first paragraph.
      const range = { from: 1, to: 9 };
      const result = executeSlashCommand(
        editor,
        findCommand("heading-2"),
        range,
      );

      expect(result).toBe(true);
      const json: JSONContent = editor.getJSON();
      expect(json.content?.[0].type).toBe("heading");
      expect(json.content?.[0].attrs?.level).toBe(2);
      expect(json.content?.[0].content?.[0].text).toBe(" Hello");
      expect(JSON.stringify(json)).not.toContain("/heading");
    });

    it("removes the slash query before inserting a bullet list", () => {
      const editor = new Editor({
        extensions: createProductionExtensions(),
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "/list Buy milk" }],
            },
          ],
        },
      });

      const range = { from: 1, to: 6 };
      const result = executeSlashCommand(
        editor,
        findCommand("bullet-list"),
        range,
      );

      expect(result).toBe(true);
      const json: JSONContent = editor.getJSON();
      expect(json.content?.[0].type).toBe("bulletList");
      expect(JSON.stringify(json)).toContain("Buy milk");
      expect(JSON.stringify(json)).not.toContain("/list");
    });

    it("removes the slash query before inserting a code block", () => {
      const editor = new Editor({
        extensions: createProductionExtensions(),
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "/code const x = 1" }],
            },
          ],
        },
      });

      const range = { from: 1, to: 6 };
      const result = executeSlashCommand(
        editor,
        findCommand("code-block"),
        range,
      );

      expect(result).toBe(true);
      const json: JSONContent = editor.getJSON();
      expect(json.content?.[0].type).toBe("codeBlock");
      expect(json.content?.[0].content?.[0].text).toBe(" const x = 1");
      expect(JSON.stringify(json)).not.toContain("/code");
    });

    it("inserts a divider and removes the slash query", () => {
      const editor = new Editor({
        extensions: createProductionExtensions(),
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "/divider" }],
            },
          ],
        },
      });

      const range = { from: 1, to: 9 };
      const result = executeSlashCommand(editor, findCommand("divider"), range);

      expect(result).toBe(true);
      const json: JSONContent = editor.getJSON();
      expect(json.content?.some((node) => node.type === "horizontalRule")).toBe(
        true,
      );
      expect(JSON.stringify(json)).not.toContain("/divider");
    });

    it("transforms an existing heading into a paragraph via slash command", () => {
      const editor = new Editor({
        extensions: createProductionExtensions(),
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "/p Downgrade me" }],
            },
          ],
        },
      });

      const range = { from: 1, to: 3 };
      const result = executeSlashCommand(
        editor,
        findCommand("paragraph"),
        range,
      );

      expect(result).toBe(true);
      const json: JSONContent = editor.getJSON();
      expect(json.content?.[0].type).toBe("paragraph");
      expect(json.content?.[0].content?.[0].text).toBe(" Downgrade me");
    });

    it("activates the slash suggestion plugin", () => {
      const editor = new Editor({
        extensions: createProductionExtensions(),
        content: { type: "doc", content: [] },
      });

      const hasSlashMenu = editor.extensionManager.extensions.some(
        (extension) => extension.name === "slashMenu",
      );
      expect(hasSlashMenu).toBe(true);
    });

    it("allows slash menu at the start of a block", () => {
      const editor = new Editor({
        extensions: createProductionExtensions(),
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "/heading" }],
            },
          ],
        },
      });

      expect(isSlashMenuAllowed({ state: editor.state, range: { from: 1, to: 9 } })).toBe(true);
    });

    it("allows slash menu after a space", () => {
      const editor = new Editor({
        extensions: createProductionExtensions(),
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "word /heading" }],
            },
          ],
        },
      });

      // `/heading` starts at position 6 (after the space at position 5).
      expect(isSlashMenuAllowed({ state: editor.state, range: { from: 6, to: 14 } })).toBe(true);
    });

    it("disallows slash menu in the middle of a word", () => {
      const editor = new Editor({
        extensions: createProductionExtensions(),
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "word/heading" }],
            },
          ],
        },
      });

      expect(isSlashMenuAllowed({ state: editor.state, range: { from: 5, to: 13 } })).toBe(false);
    });
  });

});
