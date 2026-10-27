// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { TipTapRendererV2 } from "../index";

const content = {
  type: "doc",
  content: [
    {
      type: "youtube",
      attrs: { src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    },
  ],
} as never;

describe("TipTapRendererV2 youtube", () => {
  it("renders a click-to-load facade instead of the iframe", () => {
    const html = renderToStaticMarkup(<TipTapRendererV2 content={content} />);

    expect(html).toContain("Riproduci video");
    expect(html).toContain("i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    expect(html).not.toContain("<iframe");
  });
});
