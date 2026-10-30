import { describe, expect, it } from "vitest";

import { sendWebinarPurchaseEmail } from "@/modules/mails/lib/mail";
import { db } from "@/shared/lib/db";

describe("sendWebinarPurchaseEmail", () => {
  it("does not create a contact when the purchase has no address", async () => {
    const before = await db.emailContact.count();

    expect(await sendWebinarPurchaseEmail("", "missing-product")).toBe(false);
    expect(await sendWebinarPurchaseEmail("   ", "missing-product")).toBe(
      false,
    );

    expect(await db.emailContact.count()).toBe(before);
  });
});
