// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { Editor, type JSONContent } from "@tiptap/core";

import {
  countWordsFromText,
  countWordsFromTiptap,
} from "@/shared/components/tiptap-renderer/helpers/words-counter";

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
import { estimateReadingTime } from "./writing-metrics";
import { normalizeTableSlice } from "../extensions/table/paste";
import {
  DOMParser as PMDOMParser,
  Fragment,
  Node as PMNode,
  Slice,
} from "@tiptap/pm/model";
import type { Schema } from "@tiptap/pm/model";

const collectCells = (editor: Editor) => {
  const cells: { type: string; pos: number }[] = [];
  editor.state.doc.descendants((node, pos) => {
    const role = node.type.spec.tableRole;
    if (role === "cell" || role === "header_cell") {
      cells.push({ type: node.type.name, pos });
    }
    return true;
  });
  return cells;
};

const setCursorInCell = (editor: Editor, index: number) => {
  const cells = collectCells(editor);
  const cell = cells[index];
  if (!cell) throw new Error(`No cell at index ${index}`);
  editor.commands.setTextSelection(cell.pos + 2);
};

const activeCellIndex = (editor: Editor) => {
  const $head = editor.state.selection.$head;
  return collectCells(editor).findIndex(({ pos }) => {
    const cell = editor.state.doc.nodeAt(pos);
    return cell ? $head.pos >= pos && $head.pos < pos + cell.nodeSize : false;
  });
};

const pressKey = (editor: Editor, key: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  return editor.view.someProp("handleKeyDown", (handler) =>
    handler(editor.view, event),
  );
};

const createTableEditor = () =>
  new Editor({
    extensions: createProductionExtensions(),
    content: { type: "doc", content: [] },
  });

const makeCell = (
  schema: Schema,
  text: string,
  type: "tableCell" | "tableHeader",
  attrs: Record<string, unknown> = {},
) =>
  schema.nodes[type].create(
    { colspan: 1, rowspan: 1, colwidth: null, ...attrs },
    [schema.nodes.paragraph.create(null, schema.text(text))],
  );

const makeRow = (schema: Schema, cells: PMNode[]) =>
  schema.nodes.tableRow.create(null, cells);

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

  it("derives zero word count and reading time from an empty document", () => {
    const editor = new Editor({
      extensions: createProductionExtensions(),
      content: { type: "doc", content: [] },
    });

    const wordCount = countWordsFromText(editor.getText());
    expect(wordCount).toBe(0);
    expect(estimateReadingTime(wordCount)).toBe(0);
  });

  it("derives reading time from word count and rounds up for non-empty content", () => {
    const editor = new Editor({
      extensions: createProductionExtensions(),
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "One" }],
          },
        ],
      },
    });

    const wordCount = countWordsFromText(editor.getText());
    expect(wordCount).toBe(1);
    expect(estimateReadingTime(wordCount)).toBe(1);
  });

  it("debounces a rapid sequence of edits into a single observable autosave", () => {
    vi.useFakeTimers();

    const onSave = vi.fn();
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const editor = new Editor({
      extensions: createProductionExtensions(),
      content: { type: "doc", content: [] },
      onUpdate: () => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => onSave(), 300);
      },
    });

    editor.chain().insertContent("a").run();
    editor.chain().insertContent("ab").run();
    editor.chain().insertContent("abc").run();

    expect(onSave).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    expect(onSave).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
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

    it("catalog exposes text, media and content commands including tablecontent", () => {
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
        "tablecontent",
        "table",
      ]);
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

      expect(filterSlashCommands(slashCommands, "table").map((c) => c.id)).toEqual([
        "tablecontent",
        "table",
      ]);

      expect(filterSlashCommands(slashCommands, "grid").map((c) => c.id)).toEqual([
        "table",
      ]);
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

  describe("table node", () => {
    it("inserts a 3x3 table with a header row via slash command", () => {
      const editor = new Editor({
        extensions: createProductionExtensions(),
        content: {
          type: "doc",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "/table" }] },
          ],
        },
      });

      const command = slashCommands.find((cmd) => cmd.id === "table");
      expect(command).toBeDefined();
      expect(command?.group).toBe("content");

      const result = executeSlashCommand(editor, command!, { from: 1, to: 7 });

      expect(result).toBe(true);
      const json: JSONContent = editor.getJSON();
      expect(JSON.stringify(json)).not.toContain("/table");

      const table = json.content?.find((node) => node.type === "table");
      expect(table).toBeDefined();
      expect(table?.content).toHaveLength(3);
      expect(table?.content?.[0].type).toBe("tableRow");
      expect(table?.content?.[0].content).toHaveLength(3);
      expect(table?.content?.[0].content?.[0].type).toBe("tableHeader");
      expect(table?.content?.[1].content?.[0].type).toBe("tableCell");
    });

    it("inserts a 3x3 table whose cells only contain paragraphs", () => {
      const editor = createTableEditor();
      editor.commands.insertTable();

      const json: JSONContent = editor.getJSON();
      const table = json.content?.[0];
      expect(table?.type).toBe("table");
      expect(table?.content).toHaveLength(3);

      table?.content?.forEach((row, rowIndex) => {
        expect(row.type).toBe("tableRow");
        expect(row.content).toHaveLength(3);
        row.content?.forEach((cell) => {
          expect(cell.type).toBe(rowIndex === 0 ? "tableHeader" : "tableCell");
          expect(cell.attrs).toMatchObject({ colspan: 1, rowspan: 1 });
          expect(cell.content?.length).toBe(1);
          expect(cell.content?.[0].type).toBe("paragraph");
        });
      });
    });

    it("keeps the caret inside the header row after insertion", () => {
      const editor = createTableEditor();
      editor.commands.insertTable();
      expect(activeCellIndex(editor)).toBe(0);
    });

    it("Tab moves to the next cell and adds a row on the last column", () => {
      const editor = createTableEditor();
      editor.commands.insertTable();
      setCursorInCell(editor, 0);
      pressKey(editor, "Tab");
      expect(activeCellIndex(editor)).toBe(1);

      setCursorInCell(editor, 8);
      pressKey(editor, "Tab");
      const json: JSONContent = editor.getJSON();
      expect(json.content?.[0]?.content).toHaveLength(4);
      expect(activeCellIndex(editor)).toBe(9);
    });

    it("Shift+Tab moves to the previous cell", () => {
      const editor = createTableEditor();
      editor.commands.insertTable();
      setCursorInCell(editor, 1);
      pressKey(editor, "Tab", { shiftKey: true });
      expect(activeCellIndex(editor)).toBe(0);
    });

    it("Enter moves the caret to the cell below", () => {
      const editor = createTableEditor();
      editor.commands.insertTable();
      setCursorInCell(editor, 0);
      pressKey(editor, "Enter");
      expect(activeCellIndex(editor)).toBe(3);
    });

    it("Enter on the last row appends a new row below", () => {
      const editor = createTableEditor();
      editor.commands.insertTable();
      setCursorInCell(editor, 6);
      pressKey(editor, "Enter");

      const json: JSONContent = editor.getJSON();
      expect(json.content?.[0]?.content).toHaveLength(4);
      expect(activeCellIndex(editor)).toBe(9);
    });

    it("Shift+Enter inserts a hard break inside a cell", () => {
      const editor = createTableEditor();
      editor.commands.insertTable();
      setCursorInCell(editor, 0);
      editor.commands.insertContent("a");
      pressKey(editor, "Enter", { shiftKey: true });

      const nodes: string[] = [];
      editor.state.doc.descendants((node) => {
        if (node.type.name === "hardBreak") nodes.push("br");
        if (node.isText) nodes.push(node.text ?? "");
        return true;
      });
      expect(nodes).toEqual(["a", "br"]);
    });

    it("Enter outside a table still splits the paragraph", () => {
      const editor = new Editor({
        extensions: createProductionExtensions(),
        content: {
          type: "doc",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "ab" }] },
          ],
        },
      });
      editor.commands.setTextSelection(2);
      pressKey(editor, "Enter");

      const json: JSONContent = editor.getJSON();
      expect(json.content).toHaveLength(2);
    });

    it("Escape exits the table into the following paragraph", () => {
      const editor = new Editor({
        extensions: createProductionExtensions(),
        content: {
          type: "doc",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "Before" }] },
            {
              type: "table",
              content: [
                {
                  type: "tableRow",
                  content: [
                    {
                      type: "tableCell",
                      content: [{ type: "paragraph", content: [] }],
                    },
                  ],
                },
              ],
            },
            { type: "paragraph", content: [{ type: "text", text: "After" }] },
          ],
        },
      });

      setCursorInCell(editor, 0);
      pressKey(editor, "Escape");
      expect(editor.state.selection.$head.parent.textContent).toBe("After");
    });

    it("Escape from a late-table drops the caret to the paragraph after the table", () => {
      const editor = new Editor({
        extensions: createProductionExtensions(),
        content: {
          type: "doc",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "Before" }] },
            {
              type: "table",
              content: [
                {
                  type: "tableRow",
                  content: [
                    {
                      type: "tableCell",
                      content: [{ type: "paragraph", content: [] }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      });

      setCursorInCell(editor, 0);
      pressKey(editor, "Escape");

      const selection = editor.state.selection as unknown as { jsonID: string };
      expect(selection.jsonID ?? "").toBe("text");

      const $head = editor.state.selection.$head;
      expect(editor.isActive("table")).toBe(false);
      expect($head.parent.type.spec.tableRole).toBeUndefined();
      expect($head.parent.textContent).toBe("");
    });

    it("loads and round-trips existing custom nodes and a table without drift", () => {
      const source = {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Hello" }] },
          {
            type: "table",
            content: [
              {
                type: "tableRow",
                content: [
                  {
                    type: "tableHeader",
                    content: [
                      { type: "paragraph", content: [{ type: "text", text: "H1" }] },
                    ],
                  },
                  {
                    type: "tableHeader",
                    content: [
                      { type: "paragraph", content: [{ type: "text", text: "H2" }] },
                    ],
                  },
                ],
              },
              {
                type: "tableRow",
                content: [
                  {
                    type: "tableCell",
                    content: [
                      { type: "paragraph", content: [{ type: "text", text: "A" }] },
                    ],
                  },
                  {
                    type: "tableCell",
                    content: [
                      { type: "paragraph", content: [{ type: "text", text: "B" }] },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "infobox",
            attrs: { icon: "🔥" },
            content: [
              { type: "paragraph", content: [{ type: "text", text: "Info" }] },
            ],
          },
        ],
      };

      const editor = new Editor({
        extensions: createProductionExtensions(),
        content: source,
      });
      const json = editor.getJSON();

      expect((json.content?.[0]?.content?.[0] as JSONContent).text).toBe(
        "Hello",
      );
      expect(json.content?.[1]?.type).toBe("table");
      expect(json.content?.[1]?.content).toHaveLength(2);
      expect(json.content?.[2]?.type).toBe("infobox");

      const reloaded = new Editor({
        extensions: createProductionExtensions(),
        content: json,
      });
      const roundTrip = reloaded.getJSON();
      expect(JSON.stringify(roundTrip)).toBe(JSON.stringify(json));
    });

    it("runs the paste normalizer on the editing seam", () => {
      const editor = createTableEditor();
      const { schema } = editor.state;
      const table = schema.nodes.table.create(null, [
        makeRow(schema, [makeCell(schema, "A", "tableHeader", { colspan: 2 })]),
        makeRow(schema, [makeCell(schema, "B", "tableCell"), makeCell(schema, "C", "tableCell")]),
      ]);
      const slice = new Slice(Fragment.from(table), 1, 1);

      let transformed: Slice | null = null;
      editor.view.someProp(
        "transformPasted",
        (transform) => {
          transformed = (
            transform as (slice: Slice, view: unknown) => Slice
          )(slice, editor.view);
          return true;
        },
      );

      expect(transformed).not.toBeNull();
      const normalized = transformed!.content.firstChild as PMNode;
      expect(normalized.childCount).toBe(2);
      expect(normalized.child(0).childCount).toBe(2);
      expect((normalized.child(0).child(0) as PMNode).textContent).toBe("A");
    });

    it("normalizes a merged table into an expanded rectangle", () => {
      const editor = createTableEditor();
      const { schema } = editor.state;
      const table = schema.nodes.table.create(null, [
        makeRow(schema, [makeCell(schema, "A", "tableHeader", { colspan: 2 })]),
        makeRow(schema, [makeCell(schema, "B", "tableCell"), makeCell(schema, "C", "tableCell")]),
      ]);
      const slice = new Slice(Fragment.from(table), 1, 1);

      const normalized = normalizeTableSlice(slice).content.firstChild as PMNode;

      expect(normalized.type.name).toBe("table");
      expect(normalized.childCount).toBe(2);
      expect(normalized.child(0).childCount).toBe(2);
      expect(normalized.child(0).child(0).textContent).toBe("A");
      expect(normalized.child(0).child(1).textContent).toBe("A");
      expect(
        normalized.child(0).child(0).attrs.colspan,
      ).toBe(1);
      expect(normalized.child(1).child(0).textContent).toBe("B");
      expect(normalized.child(1).child(1).textContent).toBe("C");
    });

    it("leaves a rectangular merge-free table untouched", () => {
      const editor = createTableEditor();
      const { schema } = editor.state;
      const table = schema.nodes.table.create(null, [
        makeRow(schema, [makeCell(schema, "A", "tableHeader"), makeCell(schema, "B", "tableHeader")]),
        makeRow(schema, [makeCell(schema, "C", "tableCell"), makeCell(schema, "D", "tableCell")]),
      ]);
      const slice = new Slice(Fragment.from(table), 1, 1);

      const result = normalizeTableSlice(slice);
      expect(result).toBe(slice);
    });

    it("does not leak colspan or rowspan into the serialized HTML", () => {
      const editor = createTableEditor();
      editor.commands.insertTable();
      const html = editor.getHTML();
      expect(html).toContain("<table");
      expect(html).not.toMatch(/colspan|rowspan/);
    });

    it("does not expose structural merge commands", () => {
      const editor = createTableEditor();
      editor.commands.insertTable();

      expect(editor.commands.mergeCells).toBeUndefined();
      expect(editor.commands.splitCell).toBeUndefined();
      expect(editor.commands.mergeOrSplit).toBeUndefined();
      expect(editor.commands.setCellAttribute).toBeUndefined();
    });

    it("expands an HTML-pasted merged table into a rectangular grid", () => {
      const editor = createTableEditor();
      const { schema } = editor.state;
      const dom = new DOMParser().parseFromString(
        "<table><tr><td colspan=\"2\">M</td></tr><tr><td>a</td><td>b</td></tr></table>",
        "text/html",
      );
      const parsed = PMDOMParser.fromSchema(schema).parse(dom);
      const slice = new Slice(parsed.content, 0, 0);

      let transformed: Slice | null = null;
      editor.view.someProp(
        "transformPasted",
        (transform) => {
          transformed = (
            transform as (slice: Slice, view: unknown) => Slice
          )(slice, editor.view);
          return true;
        },
      );

      expect(transformed).not.toBeNull();
      const table = transformed!.content.firstChild as PMNode;
      expect(table.type.spec.tableRole).toBe("table");
      expect(table.childCount).toBe(2);
      expect(table.child(0).childCount).toBe(2);
      expect(table.child(1).childCount).toBe(2);
      expect(table.child(0).child(0).textContent).toBe("M");
      expect(table.child(0).child(1).textContent).toBe("M");
      expect(table.child(1).child(0).textContent).toBe("a");
      expect(table.child(1).child(1).textContent).toBe("b");
      expect(table.child(0).child(0).attrs.colspan).toBe(1);
      expect(table.child(0).child(0).attrs.rowspan).toBe(1);
    });
  });

});
