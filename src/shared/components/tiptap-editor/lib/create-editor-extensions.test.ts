// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { Editor, type JSONContent } from "@tiptap/core";

import { countWordsFromTiptap } from "@/shared/components/tiptap-renderer/helpers/words-counter";

import {
  createProductionExtensions,
  TIPTAP_PLACEHOLDER,
} from "./create-editor-extensions";

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
      placeholderExtension?.options.placeholder({ editor }),
    ).toBe(TIPTAP_PLACEHOLDER);
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

});
