import { describe, expect, it } from "vitest";

import { normalizeEmail } from "@/shared/lib/email";

describe("normalizeEmail", () => {
  it.each([
    ["mario@x.com", "mario@x.com"],
    ["  mario@x.com  ", "mario@x.com"],
    ["\tMario@X.com\n", "mario@x.com"],
    ["MARIO@X.COM", "mario@x.com"],
    ["mArIo@x.CoM", "mario@x.com"],
    ["Mario+news@X.com", "mario+news@x.com"],
    ["mario.doe@gmail.com", "mario.doe@gmail.com"],
    ["mario@xn--bcher-kva.example", "mario@xn--bcher-kva.example"],
    ["José@Exämple.com", "josé@exämple.com"],
    [" Марио@Пример.рф ", "марио@пример.рф"],
  ])("normalizes %j to %j", (raw, expected) => {
    expect(normalizeEmail(raw)).toBe(expected);
  });

  it.each(["", "   ", "\t", "\n  \r\n"])(
    "returns null for blank input %j",
    (raw) => {
      expect(normalizeEmail(raw)).toBeNull();
    }
  );

  it("does not collapse +tags or dots in the local part", () => {
    expect(normalizeEmail("Mario+News@X.com")).toBe("mario+news@x.com");
    expect(normalizeEmail("mario.doe+news@x.com")).toBe("mario.doe+news@x.com");
  });

  it("does not apply Unicode normalization", () => {
    const composed = "jos\u00e9@x.com";
    const decomposed = "jose\u0301@x.com";

    expect(normalizeEmail(composed)).toBe(composed);
    expect(normalizeEmail(decomposed)).toBe(decomposed);
    expect(normalizeEmail(decomposed)).toHaveLength(decomposed.length);
  });

  it("does not validate the format", () => {
    expect(normalizeEmail("  Not-An-Email ")).toBe("not-an-email");
  });

  it("is idempotent", () => {
    const once = normalizeEmail("  Mario@X.com ");

    if (once === null) {
      throw new Error("expected a canonical address");
    }

    expect(normalizeEmail(once)).toBe(once);
  });
});
