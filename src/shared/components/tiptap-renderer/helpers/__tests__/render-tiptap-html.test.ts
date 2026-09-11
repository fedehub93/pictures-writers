import { describe, it, expect } from "vitest";
import { renderTiptapHtml } from "../render-tiptap-html";

const SIMPLE_DOC = {
  type: "doc" as const,
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text" as const, text: "Title" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text" as const, text: "A paragraph with " },
        {
          type: "text" as const,
          marks: [{ type: "bold" }],
          text: "bold",
        },
        { type: "text" as const, text: " and " },
        {
          type: "text" as const,
          marks: [{ type: "link", attrs: { href: "https://example.com" } }],
          text: "a link",
        },
        { type: "text" as const, text: "." },
      ],
    },
    {
      type: "blockquote",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text" as const, text: "Quoted text." },
          ],
        },
      ],
    },
  ],
};

describe("renderTiptapHtml", () => {
  it("returns empty string for null content", () => {
    expect(renderTiptapHtml(null)).toBe("");
  });

  it("converts Tiptap JSON to an HTML string", () => {
    const html = renderTiptapHtml(SIMPLE_DOC);

    expect(html).toBe(
      '<h2 id="title">Title</h2><p>A paragraph with <strong>bold</strong> and <a target="_blank" rel="nofollow" href="https://example.com">a link</a>.</p><blockquote class="not-prose"><p>Quoted text.</p></blockquote>',
    );
  });
});
