import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { FormElementInstance } from "../../../../types/core";

import { UploadFieldDesignerComponent } from "../designer-component";

const elementInstance: FormElementInstance<"UploadField"> = {
  id: "upload-1",
  isContainer: false,
  type: "UploadField",
  properties: {
    name: "essay",
    label: "Essay",
    helperText: "",
    files: [],
    validation: { required: true },
  },
};

describe("Upload field in the designer", () => {
  it("renders the control disabled and never performs an upload", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const html = renderToStaticMarkup(
      <UploadFieldDesignerComponent elementInstance={elementInstance} />,
    );

    expect(html).toContain("Essay");
    expect(html).toContain("Carica file");
    // The control is visible in the canvas but disabled: it has no form to
    // upload to and must not run the public transport.
    expect(html).toMatch(/<button[^>]*disabled/);
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });
});
