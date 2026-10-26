import { describe, expect, it } from "vitest";

import {
  ContactSchema,
  EmailSchema,
  FreeDigitalDownloadSchema,
  SubscribeSchema,
} from "@/schemas";

function firstIssueMessage(result: {
  success: false;
  error: { issues: { message: string }[] };
}): string | undefined {
  return result.error.issues[0]?.message;
}

describe("EmailSchema", () => {
  it("accepts a valid email", () => {
    expect(EmailSchema.parse("mario.rossi@gmail.com")).toBe(
      "mario.rossi@gmail.com",
    );
  });

  it("reports an empty email as missing", () => {
    const result = EmailSchema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(firstIssueMessage(result)).toBe("Please enter your email.");
    }
  });

  it("reports a malformed email", () => {
    const result = EmailSchema.safeParse("not-an-email");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(firstIssueMessage(result)).toBe(
        "The email address is badly formatted.",
      );
    }
  });
});

describe("SubscribeSchema", () => {
  it("accepts a newsletter subscription", () => {
    expect(SubscribeSchema.parse({ email: "ada@example.com" })).toEqual({
      email: "ada@example.com",
    });
  });

  it("rejects a subscription without an email", () => {
    const result = SubscribeSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });
});

describe("ContactSchema", () => {
  it("accepts a complete contact request", () => {
    const values = {
      name: "Mario Rossi",
      email: "mario@example.com",
      subject: "Info",
      message: "Vorrei sapere...",
    };

    expect(ContactSchema.parse(values)).toEqual(values);
  });

  it("requires every contact field", () => {
    const empty = { name: "", email: "", subject: "", message: "" };
    const result = ContactSchema.safeParse(empty);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toEqual([
        "Name is required",
        "Please enter your email.",
        "Subject is required",
        "Message is required",
      ]);
    }
  });
});

describe("FreeDigitalDownloadSchema", () => {
  const validDownload = {
    email: "ada@example.com",
    rootId: "product-root-1",
    privacyConsent: true,
  };

  it("accepts a download with consent", () => {
    expect(FreeDigitalDownloadSchema.parse(validDownload)).toEqual(
      validDownload,
    );
  });

  it("preserves extra answers collected by richer forms", () => {
    expect(
      FreeDigitalDownloadSchema.parse({ ...validDownload, nome: "Ada" }),
    ).toMatchObject({ nome: "Ada" });
  });

  it("requires a product", () => {
    const result = FreeDigitalDownloadSchema.safeParse({
      ...validDownload,
      rootId: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(firstIssueMessage(result)).toBe("A product is required.");
    }
  });

  it("requires privacy consent", () => {
    const result = FreeDigitalDownloadSchema.safeParse({
      ...validDownload,
      privacyConsent: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(firstIssueMessage(result)).toBe(
        "You must accept the privacy policy.",
      );
    }
  });
});
