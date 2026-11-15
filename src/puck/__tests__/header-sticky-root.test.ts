import { describe, expect, it } from "vitest";

import { config as pageEditorConfig } from "../config";
import { editorConfigForRegion } from "../region/editor-config";
import { RootEditor } from "../root";
import { HeaderRootEditor } from "../root/header";

function readRootFields(root: { fields?: unknown } | undefined) {
  return (root?.fields ?? {}) as Record<string, unknown>;
}

describe("Header sticky root field", () => {
  it("exposes the switch on the Header root", () => {
    const config = editorConfigForRegion("HEADER");
    const fields = readRootFields(config.root);

    expect(config.root).toBe(HeaderRootEditor);
    expect(fields).toHaveProperty("sticky");
    expect(fields.sticky).toMatchObject({ type: "custom" });
  });

  it("keeps the shared root fields on the Header root", () => {
    const fields = readRootFields(HeaderRootEditor);

    expect(fields).not.toHaveProperty("title");
    expect(fields).toHaveProperty("size");
    expect(fields).toHaveProperty("spacing");
  });

  it("does not expose the switch on the Footer root", () => {
    const config = editorConfigForRegion("FOOTER");

    expect(config.root).toBe(RootEditor);
    expect(readRootFields(config.root)).not.toHaveProperty("sticky");
  });

  it("does not expose the switch on the page root", () => {
    expect(pageEditorConfig.root).not.toBe(RootEditor);
    expect(pageEditorConfig.root).not.toBe(HeaderRootEditor);
    expect(readRootFields(pageEditorConfig.root)).not.toHaveProperty("sticky");
  });
});
