import { describe, expect, it } from "vitest";

import { MediaType } from "@/generated/prisma";

import { classifyMediaType } from "../media-type";

describe("classifyMediaType", () => {
  it.each([
    ["image/png", MediaType.IMAGE],
    ["image/svg+xml", MediaType.IMAGE],
    ["video/mp4", MediaType.VIDEO],
    ["audio/mpeg", MediaType.AUDIO],
    ["application/pdf", MediaType.FILE],
    ["text/plain", MediaType.FILE],
    ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", MediaType.FILE],
  ])("classifies %s as %s", (mimeType, expected) => {
    expect(classifyMediaType(mimeType)).toBe(expected);
  });

  it("ignores MIME parameters and casing", () => {
    expect(classifyMediaType("Text/Plain; charset=utf-8")).toBe(MediaType.FILE);
  });

  it.each([
    ["application/octet-stream"],
    ["application/x-msdownload"],
    ["text/html"],
    [""],
    [null],
    [undefined],
  ])("refuses the unclassifiable type %s", (mimeType) => {
    expect(classifyMediaType(mimeType)).toBeNull();
  });
});
