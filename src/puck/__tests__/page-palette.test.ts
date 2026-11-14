import { describe, expect, it } from "vitest";

import { config as pageEditorConfig } from "../config";
import { pageRenderConfig } from "../render-config";

describe("page palette", () => {
  it("offers the Button under Actions and not under Basic", () => {
    expect(pageEditorConfig.categories?.actions).toEqual({
      title: "Actions",
      components: ["Button"],
    });
    expect(pageEditorConfig.categories?.basic?.components).not.toContain(
      "Button",
    );
  });

  it("registers Button and no Link in the page editor and public configs", () => {
    for (const config of [pageEditorConfig, pageRenderConfig]) {
      expect(Object.keys(config.components)).toContain("Button");
      expect(Object.keys(config.components)).not.toContain("Link");
    }
  });
});
