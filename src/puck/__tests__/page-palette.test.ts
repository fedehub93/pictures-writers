import { describe, expect, it } from "vitest";

import type { Config } from "@puckeditor/core";

import { config as pageEditorConfig } from "../config";
import { editorConfigForRegion } from "../region/editor-config";
import { pageRenderConfig } from "../render-config";

/**
 * Editor configs a palette can be loaded from. The read-only Site layout
 * preview configs are drawn with `Render`, never opened in an editor, so they
 * are not part of this contract.
 */
const EDITOR_CONFIGS: Record<string, Config> = {
  page: pageEditorConfig,
  header: editorConfigForRegion("HEADER"),
  footer: editorConfigForRegion("FOOTER"),
};

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

describe("editor palette categories", () => {
  it.each(Object.entries(EDITOR_CONFIGS))(
    "declares the categories the %s palette is drawn from",
    (_name, config) => {
      expect(config.categories).toBeDefined();
      expect(Object.keys(config.categories ?? {}).length).toBeGreaterThan(0);
    },
  );

  it.each(Object.entries(EDITOR_CONFIGS))(
    "lists only registered blocks in the %s categories",
    (_name, config) => {
      for (const category of Object.values(config.categories ?? {})) {
        for (const component of category.components ?? []) {
          expect(config.components).toHaveProperty(component);
        }
      }
    },
  );

  it("offers neither Flex nor Grid on a page", () => {
    const offered = Object.values(pageEditorConfig.categories ?? {}).flatMap(
      (category) => category.components ?? [],
    );

    expect(offered).not.toContain("Flex");
    expect(offered).not.toContain("Grid");
  });
});
