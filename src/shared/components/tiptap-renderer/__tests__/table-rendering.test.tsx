// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { Editor, getSchemaByResolvedExtensions, resolveExtensions, type JSONContent } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";
import { renderToStaticMarkup } from "react-dom/server";

import { createProductionExtensions } from "@/shared/components/tiptap-editor/lib/create-editor-extensions";
import { renderTiptapHtml } from "../helpers/render-tiptap-html";
import { tiptapContentExtensions } from "../extensions";
import { TipTapRendererV2 } from "../index";

const textNode = (text: string): JSONContent => ({ type: "text", text });
const paragraph = (text: string): JSONContent => ({
  type: "paragraph",
  content: [textNode(text)],
});
const headerCell = (
  text: string,
  attrs?: JSONContent["attrs"],
): JSONContent => ({
  type: "tableHeader",
  ...(attrs ? { attrs } : {}),
  content: [paragraph(text)],
});
const dataCell = (text: string): JSONContent => ({
  type: "tableCell",
  content: [paragraph(text)],
});
const row = (cells: JSONContent[]): JSONContent => ({
  type: "tableRow",
  content: cells,
});

const THREE_BY_THREE: JSONContent = {
  type: "doc",
  content: [
    paragraph("Before the table."),
    {
      type: "table",
      content: [
        row([headerCell("Rank"), headerCell("City"), headerCell("Population")]),
        row([dataCell("1"), dataCell("Rome"), dataCell("2.8M")]),
        row([dataCell("2"), dataCell("Milan"), dataCell("1.4M")]),
      ],
    },
    paragraph("After the table."),
  ],
};

const produce = (content: JSONContent): JSONContent => {
  const editor = new Editor({
    extensions: createProductionExtensions(),
    content,
  });
  const json = editor.getJSON();
  editor.destroy();
  return json;
};

describe("public Tiptap table rendering seam (issue 05)", () => {
  it("renders a produced table document to HTML with full borders and a highlighted header", () => {
    const html = renderTiptapHtml(produce(THREE_BY_THREE));

    expect(html).toContain(
      '<div class="post__table-scroll"><table class="post__table"',
    );
    expect(html).toContain("<tbody>");
    expect(html).toContain("<tr>");
    expect(html).toContain("<th><p>Rank</p></th>");
    expect(html).toContain("<td><p>Rome</p></td>");
    expect(html).toContain(
      '<colgroup><col style="min-width: 25px"/><col style="min-width: 25px"/><col style="min-width: 25px"/></colgroup>',
    );
    expect(html).toContain("<p>Before the table.</p>");
    expect(html).toContain('<p>After the table.</p>');
  });

  it("renders the same table document to a React element", () => {
    const markup = renderToStaticMarkup(
      <TipTapRendererV2 content={produce(THREE_BY_THREE)} />,
    );

    expect(markup).toContain('<div class="post__table-scroll">');
    expect(markup).toContain('<table class="post__table"');
    expect(markup).toContain("<tbody>");
    expect(markup).toContain("<tr>");
    expect(markup).toContain("<th><p>Rank</p></th>");
    expect(markup).toContain("<td><p>Rome</p></td>");
    expect(markup).toContain('class="prose md:prose-md lg:prose-lg max-w-full"');
  });

  it("does not leak internal cell attributes into the public HTML", () => {
    const html = renderTiptapHtml(produce(THREE_BY_THREE));
    expect(html).not.toMatch(/colspan|rowspan|colwidth/);
  });

  it("wraps the table in a horizontal scroll layer in both output paths", () => {
    const produced = produce(THREE_BY_THREE);

    const html = renderTiptapHtml(produced);
    expect(html).toMatch(
      /<div class="post__table-scroll"><table class="post__table"/,
    );

    const markup = renderToStaticMarkup(
      <TipTapRendererV2 content={produced} />,
    );
    expect(markup).toMatch(
      /<div class="post__table-scroll"><table class="post__table"/,
    );
  });

  it("round-trips a produced table document through the renderer schema without semantic loss", () => {
    const produced = produce(THREE_BY_THREE);

    const schema = getSchemaByResolvedExtensions(
      resolveExtensions(tiptapContentExtensions),
    );
    const rendererDoc = Node.fromJSON(schema, produced);
    expect(rendererDoc.toJSON()).toEqual(produced);

    expect(produce(produced)).toEqual(produced);
  });

  it("preserves explicit column widths and alignment in the public HTML", () => {
    const fixture: JSONContent = {
      type: "doc",
      content: [
        {
          type: "table",
          content: [
            row([
              headerCell("A", { colwidth: [120], align: "center" }),
              headerCell("B", { colwidth: [180] }),
            ]),
            row([dataCell("a"), dataCell("b")]),
          ],
        },
      ],
    };

    const html = renderTiptapHtml(produce(fixture));

    expect(html).toContain(
      '<table class="post__table" style="min-width: max(100%, 300px)"',
    );
    expect(html).toContain('<div class="post__table-scroll">');
    expect(html).toContain('<col style="width: 120px"/>');
    expect(html).toContain('<col style="width: 180px"/>');
    expect(html).toContain('style="text-align: center"');
  });

  it("keeps the table filling its container when no column widths are persisted", () => {
    const html = renderTiptapHtml(produce(THREE_BY_THREE));

    expect(html).toContain(
      '<table class="post__table" style="min-width: max(100%, 75px)"',
    );
  });

  it("renders a table without a header row using body cells only", () => {
    const fixture: JSONContent = {
      type: "doc",
      content: [
        {
          type: "table",
          content: [
            row([dataCell("a"), dataCell("b")]),
            row([dataCell("c"), dataCell("d")]),
          ],
        },
      ],
    };

    const html = renderTiptapHtml(produce(fixture));
    expect(html).toContain('<table class="post__table"');
    expect(html).not.toContain("<th>");
  });

  it("renders a table side by side with existing renderer nodes", () => {
    const fixture: JSONContent = {
      type: "doc",
      content: [
        paragraph("Intro"),
        { type: "heading", attrs: { level: 2 }, content: [textNode("Section")] },
        { type: "blockquote", content: [paragraph("Quote")] },
        { type: "infobox", attrs: { icon: "&#x1F525;" }, content: [paragraph("Tip")] },
        { type: "image", attrs: { src: "https://example.com/img.jpg", alt: "Alt" } },
        { type: "tablecontent", content: [paragraph("TOC")] },
        {
          type: "table",
          content: [
            row([headerCell("H"), headerCell("V")]),
            row([dataCell("1"), dataCell("2")]),
          ],
        },
      ],
    };

    const produced = produce(fixture);
    const html = renderTiptapHtml(produced);

    expect(html).toContain("<p>Intro</p>");
    expect(html).toContain('data-type="infobox"');
    expect(html).toContain(">Tip</p>");
    expect(html).toContain('<img src="https://example.com/img.jpg" alt="Alt"');
    expect(html).toContain('data-type="tablecontent"');
    expect(html).toContain('<blockquote class="not-prose"><p>Quote</p></blockquote>');
    expect(html).toContain('<table class="post__table"');
    expect(html).toContain("<th><p>H</p></th>");
  });
});