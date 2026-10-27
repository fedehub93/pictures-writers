import { describe, expect, it } from "vitest";

import { getYouTubeVideoId } from "../parse-youtube-url";

describe("getYouTubeVideoId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/live/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["//www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ])("parses %s", (src, expected) => {
    expect(getYouTubeVideoId(src)).toBe(expected);
  });

  it("returns null for non-YouTube URLs", () => {
    expect(getYouTubeVideoId("https://example.com/watch?v=abc")).toBeNull();
  });

  it("returns null for playlists", () => {
    expect(
      getYouTubeVideoId("https://www.youtube.com/embed/videoseries?list=PL123"),
    ).toBeNull();
  });
});
