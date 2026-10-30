import { describe, expect, it } from "vitest";

import { htmlToPlainText } from "../html-to-text";

describe("htmlToPlainText", () => {
  it("emits one line per block", () => {
    expect(htmlToPlainText("<p>Hello</p><p>World</p>")).toBe("Hello\nWorld");
  });

  it("keeps line breaks", () => {
    expect(htmlToPlainText("<p>First<br>Second</p>")).toBe("First\nSecond");
  });

  it("prefixes unordered list items with a marker", () => {
    expect(htmlToPlainText("<ul><li>One</li><li>Two</li></ul>")).toBe(
      "- One\n- Two",
    );
  });

  it("keeps the paragraph inside a list item on the marker line", () => {
    expect(htmlToPlainText("<ul><li><p>One</p></li></ul>")).toBe("- One");
  });

  it("numbers ordered list items", () => {
    expect(htmlToPlainText("<ol><li>First</li><li>Second</li></ol>")).toBe(
      "1. First\n2. Second",
    );
  });

  it("restarts numbering for a nested ordered list", () => {
    expect(
      htmlToPlainText(
        "<ul><li>Parent<ol><li>Child</li><li>Child two</li></ol></li><li>Sibling</li></ul>",
      ),
    ).toBe("- Parent\n1. Child\n2. Child two\n- Sibling");
  });

  it("keeps nested unordered list markers", () => {
    expect(
      htmlToPlainText(
        "<ul><li>Parent<ul><li>Child</li></ul></li><li>Sibling</li></ul>",
      ),
    ).toBe("- Parent\n- Child\n- Sibling");
  });

  it("honours an ordered list start attribute", () => {
    expect(
      htmlToPlainText('<ol start="3"><li>Third</li><li>Fourth</li></ol>'),
    ).toBe("3. Third\n4. Fourth");
  });

  it("writes a link label followed by its URL", () => {
    expect(
      htmlToPlainText(
        '<p>See <a href="https://example.com/docs?a=1&amp;b=2">the docs</a> now</p>',
      ),
    ).toBe("See the docs (https://example.com/docs?a=1&b=2) now");
  });

  it("does not repeat a URL used as the link label", () => {
    expect(
      htmlToPlainText(
        '<p><a href="https://example.com">https://example.com</a></p>',
      ),
    ).toBe("https://example.com");
  });

  it("decodes entities", () => {
    expect(htmlToPlainText("<p>Tom &amp; Jerry&nbsp;&lt;3</p>")).toBe(
      "Tom & Jerry <3",
    );
    expect(htmlToPlainText("<p>Hi&mdash;it&rsquo;s &hellip;</p>")).toBe(
      "Hi\u2014it\u2019s \u2026",
    );
  });

  it("keeps image alt text, rules and table cells readable", () => {
    expect(
      htmlToPlainText('<p>Logo <img src="logo.png" alt="Company logo"> end</p>'),
    ).toBe("Logo Company logo end");
    expect(htmlToPlainText("<p>One</p><hr><p>Two</p>")).toBe("One\nTwo");
    expect(
      htmlToPlainText(
        "<table><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></table>",
      ),
    ).toBe("A B\nC D");
  });

  it("collapses whitespace and never emits triple blank lines", () => {
    expect(htmlToPlainText("<p>a   \n\t b</p>")).toBe("a b");
    expect(htmlToPlainText("<p>a</p><br><br><br><p>b</p>")).toBe("a\n\nb");
  });

  it("keeps a stray less-than sign", () => {
    expect(htmlToPlainText("<p>2 < 3</p>")).toBe("2 < 3");
  });

  it("drops scripts, styles and document chrome", () => {
    expect(
      htmlToPlainText(
        "<!doctype html><html><head><title>Hi</title><style>.a{color:red}</style></head><body><script>alert(1)</script><p>Safe</p></body></html>",
      ),
    ).toBe("Safe");
  });

  it("returns an empty string for empty input", () => {
    expect(htmlToPlainText("")).toBe("");
    expect(htmlToPlainText("   ")).toBe("");
  });
});
