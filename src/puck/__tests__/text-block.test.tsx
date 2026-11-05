import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { config } from "../config";
import { config as customConfig } from "../custom-config";
import { TextBlockUi } from "../blocks/Text/ui/text";

describe("Text block", () => {
  it("renders a semantic paragraph", () => {
    const html = renderToStaticMarkup(<TextBlockUi text="Hello world" />);

    expect(html).toContain("<p");
    expect(html).toContain(">Hello world</p>");
  });

  it("applies alignment and color to the paragraph", () => {
    const html = renderToStaticMarkup(
      <TextBlockUi text="Centered" align="center" color="var(--primary)" />,
    );

    expect(html).toContain("text-align:center");
    expect(html).toContain("color:var(--primary)");
  });

  it("leaves the text color inherited when no color is set", () => {
    const html = renderToStaticMarkup(<TextBlockUi text="Default" />);

    expect(html).not.toContain("color:");
  });

  it("is registered in both page editor configs", () => {
    expect(Object.keys(config.components)).toContain("Text");
    expect(Object.keys(customConfig.components)).toContain("Text");
  });
});
