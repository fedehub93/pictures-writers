import { describe, expect, it } from "vitest";

import {
  formatFileSize,
  formatRelativeTime,
  htmlToText,
  initials,
  messagePreview,
  parseAddress,
  replySubject,
  signatureToHtml,
} from "../format";

describe("conversation format helpers", () => {
  describe("htmlToText", () => {
    it("strips tags and keeps paragraph breaks", () => {
      const text = htmlToText("<p>Hello</p><p>World</p>");

      expect(text).toBe("Hello\nWorld");
    });

    it("drops style and script content", () => {
      const text = htmlToText(
        "<style>.a{color:red}</style><script>alert(1)</script><p>Safe</p>",
      );

      expect(text).toBe("Safe");
    });

    it("decodes common entities", () => {
      expect(htmlToText("<p>Tom &amp; Jerry&nbsp;&lt;3</p>")).toBe(
        "Tom & Jerry <3",
      );
    });
  });

  describe("messagePreview", () => {
    it("falls back to the text body and collapses whitespace", () => {
      expect(messagePreview({ bodyText: "a\n\nb   c" })).toBe("a b c");
    });

    it("prefers the html body over a stale text part", () => {
      expect(
        messagePreview({
          bodyHtml: "<ul><li>Fresh</li><li>List</li></ul>",
          bodyText: "stale preview",
        }),
      ).toBe("- Fresh - List");
    });

    it("falls back to the html body", () => {
      expect(messagePreview({ bodyHtml: "<p>Hi <b>there</b></p>" })).toBe(
        "Hi there",
      );
    });

    it("truncates to the maximum length", () => {
      expect(messagePreview({ bodyText: "x".repeat(300) }, 10)).toHaveLength(
        10,
      );
    });

    it("returns an empty string when there is no body", () => {
      expect(messagePreview({})).toBe("");
    });
  });

  describe("parseAddress", () => {
    it("splits a display name and email", () => {
      expect(parseAddress("Jessica Ball <jessica@example.com>")).toEqual({
        name: "Jessica Ball",
        email: "jessica@example.com",
      });
    });

    it("strips surrounding quotes from the display name", () => {
      expect(parseAddress('"Jessica Ball" <jessica@example.com>')).toEqual({
        name: "Jessica Ball",
        email: "jessica@example.com",
      });
    });

    it("returns a bare address with no name", () => {
      expect(parseAddress("jessica@example.com")).toEqual({
        email: "jessica@example.com",
      });
    });
  });

  describe("initials", () => {
    it("uses the first letters of a full name", () => {
      expect(initials("Jessica Ball")).toBe("JB");
    });

    it("uses the local part of an email", () => {
      expect(initials("jessica.ball@example.com")).toBe("JB");
    });

    it("falls back when the value is empty", () => {
      expect(initials("   ")).toBe("?");
    });
  });

  describe("formatFileSize", () => {
    it("formats bytes and kilobytes", () => {
      expect(formatFileSize(512)).toBe("512 B");
      expect(formatFileSize(1024)).toBe("1.00 KB");
      expect(formatFileSize(53440)).toBe("52.19 KB");
    });

    it("falls back for a missing size", () => {
      expect(formatFileSize(null)).toBe("—");
    });
  });

  describe("formatRelativeTime", () => {
    const now = new Date("2026-10-17T12:00:00.000Z");

    it("formats minutes, hours and days", () => {
      expect(formatRelativeTime(new Date("2026-10-17T11:58:00.000Z"), now)).toBe(
        "2m",
      );
      expect(formatRelativeTime(new Date("2026-10-17T09:00:00.000Z"), now)).toBe(
        "3h",
      );
      expect(formatRelativeTime(new Date("2026-10-15T12:00:00.000Z"), now)).toBe(
        "2d",
      );
    });

    it("uses an absolute date beyond a week", () => {
      expect(
        formatRelativeTime(new Date("2026-08-28T12:00:00.000Z"), now),
      ).toBe("28 Aug");
    });
  });

  describe("replySubject", () => {
    it("prefixes a subject with Re:", () => {
      expect(replySubject("Query about socks")).toBe("Re: Query about socks");
    });

    it("does not double-prefix an existing reply", () => {
      expect(replySubject("Re: Query about socks")).toBe(
        "Re: Query about socks",
      );
      expect(replySubject("RE: Query about socks")).toBe(
        "RE: Query about socks",
      );
    });

    it("falls back to a bare Re: for a missing subject", () => {
      expect(replySubject(null)).toBe("Re:");
      expect(replySubject("  ")).toBe("Re:");
    });
  });

  describe("signatureToHtml", () => {
    it("renders each line as a paragraph", () => {
      expect(signatureToHtml("Best,\nSupport")).toBe(
        "<p>Best,</p><p>Support</p>",
      );
    });

    it("escapes HTML from untrusted signatures", () => {
      expect(signatureToHtml("<script>alert(1)</script>")).toBe(
        "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>",
      );
    });

    it("returns an empty string for a missing signature", () => {
      expect(signatureToHtml(null)).toBe("");
      expect(signatureToHtml("   ")).toBe("");
    });
  });
});
