// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { Editor, type JSONContent } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";

import { createProductionExtensions } from "../lib/create-editor-extensions";
import { shouldShowBubbleMenu } from "./bubble-menu-utils";

const createEditor = (content: JSONContent) =>
  new Editor({
    extensions: createProductionExtensions(),
    content,
  });

describe("bubble menu", () => {
  describe("visibility predicate", () => {
    it("returns false for an empty text selection", () => {
      const editor = createEditor({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hello world" }],
          },
        ],
      });

      editor.commands.setTextSelection({ from: 1, to: 1 });

      const result = shouldShowBubbleMenu({
        editor,
        state: editor.state,
        from: editor.state.selection.from,
        to: editor.state.selection.to,
      });

      expect(result).toBe(false);
    });

    it("returns true for a non-empty text selection", () => {
      const editor = createEditor({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hello world" }],
          },
        ],
      });

      editor.commands.setTextSelection({ from: 1, to: 6 });

      const result = shouldShowBubbleMenu({
        editor,
        state: editor.state,
        from: editor.state.selection.from,
        to: editor.state.selection.to,
      });

      expect(result).toBe(true);
    });

    it("returns false for a node selection", () => {
      const editor = createEditor({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hello" }],
          },
          {
            type: "image",
            attrs: { src: "https://example.com/img.jpg", alt: "example" },
          },
        ],
      });

      const imagePos = editor.state.doc.resolve(0).posAtIndex(1, 0);
      const tr = editor.state.tr;
      tr.setSelection(NodeSelection.create(editor.state.doc, imagePos));
      editor.view.dispatch(tr);

      const result = shouldShowBubbleMenu({
        editor,
        state: editor.state,
        from: editor.state.selection.from,
        to: editor.state.selection.to,
      });

      expect(result).toBe(false);
    });

    it("returns false when the editor is not editable", () => {
      const editor = createEditor({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hello world" }],
          },
        ],
      });

      editor.setEditable(false);
      editor.commands.setTextSelection({ from: 1, to: 6 });

      const result = shouldShowBubbleMenu({
        editor,
        state: editor.state,
        from: editor.state.selection.from,
        to: editor.state.selection.to,
      });

      expect(result).toBe(false);
    });
  });

  describe("inline formatting commands", () => {
    it("toggles bold on the selected text", () => {
      const editor = createEditor({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hello world" }],
          },
        ],
      });

      editor.commands.setTextSelection({ from: 1, to: 6 });
      editor.chain().focus().toggleBold().run();

      expect(editor.isActive("bold")).toBe(true);

      editor.chain().focus().toggleBold().run();

      expect(editor.isActive("bold")).toBe(false);
    });

    it("toggles italic on the selected text", () => {
      const editor = createEditor({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hello world" }],
          },
        ],
      });

      editor.commands.setTextSelection({ from: 1, to: 6 });
      editor.chain().focus().toggleItalic().run();

      expect(editor.isActive("italic")).toBe(true);

      editor.chain().focus().toggleItalic().run();

      expect(editor.isActive("italic")).toBe(false);
    });

    it("toggles underline on the selected text", () => {
      const editor = createEditor({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hello world" }],
          },
        ],
      });

      editor.commands.setTextSelection({ from: 1, to: 6 });
      editor.chain().focus().toggleUnderline().run();

      expect(editor.isActive("underline")).toBe(true);

      editor.chain().focus().toggleUnderline().run();

      expect(editor.isActive("underline")).toBe(false);
    });

    it("sets a link on the selected text", () => {
      const editor = createEditor({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hello world" }],
          },
        ],
      });

      editor.commands.setTextSelection({ from: 1, to: 6 });
      editor.chain().focus().setLink({ href: "https://example.com" }).run();

      expect(editor.isActive("link")).toBe(true);
      const json = editor.getJSON();
      expect(json.content?.[0].content?.[0].marks).toContainEqual(
        expect.objectContaining({
          type: "link",
          attrs: expect.objectContaining({ href: "https://example.com" }),
        }),
      );
    });

    it("removes a link from the selected text", () => {
      const editor = createEditor({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Hello world",
                marks: [
                  {
                    type: "link",
                    attrs: { href: "https://example.com", nofollow: true },
                  },
                ],
              },
            ],
          },
        ],
      });

      editor.commands.setTextSelection({ from: 1, to: 6 });
      editor.chain().focus().unsetLink().run();

      expect(editor.isActive("link")).toBe(false);
      const json = editor.getJSON();
      expect(json.content?.[0].content?.[0].marks).toBeUndefined();
    });
  });
});
