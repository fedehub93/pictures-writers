import { describe, expect, it } from "vitest";

import { db } from "@/shared/lib/db";

import {
  BUILT_IN_CONTACT_FORM_ID,
  BUILT_IN_EBOOK_FORM_ID,
  BUILT_IN_NEWSLETTER_FORM_ID,
} from "../built-in-forms";

describe("built-in form identities", () => {
  it("exposes the stable ids the seed migration writes", () => {
    expect(BUILT_IN_NEWSLETTER_FORM_ID).toBe("built-in-form-newsletter");
    expect(BUILT_IN_EBOOK_FORM_ID).toBe("built-in-form-ebook");
    expect(BUILT_IN_CONTACT_FORM_ID).toBe(
      "cad10953-192a-423f-9d75-852a2b26034f",
    );
  });

  it("seeds the two shadow Forms in the test database after migration", async () => {
    const newsletter = await db.form.findUnique({
      where: { id: BUILT_IN_NEWSLETTER_FORM_ID },
    });
    const ebook = await db.form.findUnique({
      where: { id: BUILT_IN_EBOOK_FORM_ID },
    });

    expect(newsletter).not.toBeNull();
    expect(newsletter?.name).toBe("Newsletter (interno)");
    expect(newsletter?.fields).toBeNull();
    expect(newsletter?.content).toBeNull();

    expect(ebook).not.toBeNull();
    expect(ebook?.name).toBe("eBook (interno)");
    expect(ebook?.fields).toBeNull();
    expect(ebook?.content).toBeNull();
  });
});
