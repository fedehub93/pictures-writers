import { describe, expect, it } from "vitest";

import { settingsUpdateSchema } from "../schemas";

describe("mail settings schema", () => {
  it("accepts the global free digital download template", () => {
    const parsed = settingsUpdateSchema.parse({
      id: "settings-1",
      freeDigitalDownloadTemplateId: "template-1",
    });

    expect(parsed.freeDigitalDownloadTemplateId).toBe("template-1");
  });

  it("accepts clearing the template", () => {
    const parsed = settingsUpdateSchema.parse({
      id: "settings-1",
      freeDigitalDownloadTemplateId: null,
    });

    expect(parsed.freeDigitalDownloadTemplateId).toBeNull();
  });
});
