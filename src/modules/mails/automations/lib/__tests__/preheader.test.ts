import { describe, expect, it } from "vitest";

import { applyPreheader } from "../preheader";

describe("applyPreheader", () => {
  it("leaves the html untouched when the preview text is blank", () => {
    expect(applyPreheader("<p>Body</p>", "")).toBe("<p>Body</p>");
    expect(applyPreheader("<p>Body</p>", "   ")).toBe("<p>Body</p>");
    expect(applyPreheader("<p>Body</p>")).toBe("<p>Body</p>");
  });

  it("injects the preheader right after the opening body tag", () => {
    const html = "<!doctype html><html><body><p>Body</p></body></html>";
    const result = applyPreheader(html, "Welcome");

    const preheaderAt = result.indexOf("Welcome");
    expect(preheaderAt).toBeGreaterThan(result.indexOf("<body>"));
    expect(preheaderAt).toBeLessThan(result.indexOf("<p>Body</p>"));
  });

  it("prepends the preheader to an html fragment", () => {
    const result = applyPreheader("<p>Body</p>", "Welcome");

    expect(result.startsWith("<span")).toBe(true);
    expect(result).toContain("<p>Body</p>");
  });

  it("hides the preheader from the reader", () => {
    const result = applyPreheader("<p>Body</p>", "Welcome");

    expect(result).toContain("display:none");
  });

  it("escapes html in the preview text", () => {
    const result = applyPreheader("<p>Body</p>", "Tom & <Jerry>");

    expect(result).toContain("Tom &amp; &lt;Jerry&gt;");
    expect(result).not.toContain("<Jerry>");
  });
});
