import { describe, expect, it } from "vitest";

import {
  formInsertSchema,
  formUpdateSchema,
  normalizeInteractionType,
} from "../schemas";

describe("form schemas", () => {
  it("accepts an interaction type on insert and update", () => {
    expect(
      formInsertSchema.parse({
        name: "Free ebook",
        interactionType: "ebook_downloaded",
      }),
    ).toMatchObject({ interactionType: "ebook_downloaded" });

    expect(
      formUpdateSchema.parse({
        id: "form-1",
        name: "Free workbook",
        interactionType: "workbook_downloaded",
      }),
    ).toMatchObject({ interactionType: "workbook_downloaded" });
  });

  it("allows forms without an interaction type", () => {
    expect(formInsertSchema.parse({ name: "Contact" }).interactionType).toBe(
      undefined,
    );
  });

  it("normalises an empty interaction type to null", () => {
    expect(normalizeInteractionType("")).toBeNull();
    expect(normalizeInteractionType("  ")).toBeNull();
    expect(normalizeInteractionType(undefined)).toBeNull();
    expect(normalizeInteractionType("ebook_downloaded")).toBe(
      "ebook_downloaded",
    );
  });
});
