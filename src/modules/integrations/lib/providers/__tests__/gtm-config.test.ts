import { describe, expect, it } from "vitest";

import { gtmConfigSchema } from "../gtm-config";

describe("gtmConfigSchema", () => {
  it("accepts a valid container id", () => {
    expect(gtmConfigSchema.parse({ containerId: "GTM-ABC1234" })).toEqual({
      containerId: "GTM-ABC1234",
    });
  });

  it("trims surrounding whitespace and uppercases the container id", () => {
    expect(
      gtmConfigSchema.parse({ containerId: "  gtm-abc1234  " }),
    ).toEqual({ containerId: "GTM-ABC1234" });
  });

  it.each([[""], ["   "], ["GT-XXXX"], ["ABC1234"], ["GTM-"], ["GTM-AB1"]])(
    "rejects %j",
    (containerId) => {
      expect(gtmConfigSchema.safeParse({ containerId }).success).toBe(false);
    },
  );

  it("rejects a missing container id", () => {
    expect(gtmConfigSchema.safeParse({}).success).toBe(false);
  });

  it("rejects a pasted snippet instead of extracting an id from it", () => {
    const snippet = [
      "<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});",
      "var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;",
      "j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);})",
      "(window,document,'script','dataLayer','GTM-ABC1234');</script>",
      '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-ABC1234"></iframe></noscript>',
    ].join("\n");

    expect(gtmConfigSchema.safeParse({ containerId: snippet }).success).toBe(
      false,
    );
  });

  it("names the expected shape in the validation message", () => {
    const result = gtmConfigSchema.safeParse({ containerId: "GT-XXXX" });

    expect(result.error?.issues[0]?.message).toContain("GTM-XXXXXXX");
  });

  it("reports a dedicated message for empty input", () => {
    const result = gtmConfigSchema.safeParse({ containerId: "   " });

    expect(result.error?.issues[0]?.message).toMatch(/required/i);
  });
});
