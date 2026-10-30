import { beforeEach, describe, expect, it } from "vitest";

import {
  cacheMessageHeight,
  clearMessageHeightCache,
  getCachedMessageHeight,
  messageHeightKey,
} from "../message-height-cache";

describe("message height cache", () => {
  beforeEach(() => {
    clearMessageHeightCache();
  });

  it("keeps the images-blocked and images-revealed heights apart", () => {
    cacheMessageHeight(messageHeightKey("message-1", false), 320);

    expect(getCachedMessageHeight(messageHeightKey("message-1", false))).toBe(
      320,
    );
    expect(getCachedMessageHeight(messageHeightKey("message-1", true))).toBe(
      null,
    );
  });

  it("returns null for a message that was never measured", () => {
    expect(
      getCachedMessageHeight(messageHeightKey("message-unknown", false)),
    ).toBeNull();
  });

  it("rounds sub-pixel measurements up and ignores unusable ones", () => {
    const key = messageHeightKey("message-2", false);

    cacheMessageHeight(key, 319.2);
    expect(getCachedMessageHeight(key)).toBe(320);

    cacheMessageHeight(key, 0);
    cacheMessageHeight(key, Number.NaN);
    cacheMessageHeight(key, -10);
    expect(getCachedMessageHeight(key)).toBe(320);
  });

  it("keeps the cache bounded, evicting the oldest measurement first", () => {
    for (let index = 0; index < 205; index += 1) {
      cacheMessageHeight(messageHeightKey(`message-${index}`, false), 100);
    }

    expect(
      getCachedMessageHeight(messageHeightKey("message-0", false)),
    ).toBeNull();
    expect(
      getCachedMessageHeight(messageHeightKey("message-204", false)),
    ).toBe(100);
  });

  it("refreshes the entry instead of evicting a recently measured message", () => {
    for (let index = 0; index < 200; index += 1) {
      cacheMessageHeight(messageHeightKey(`message-${index}`, false), 100);
    }

    const oldestKey = messageHeightKey("message-0", false);
    cacheMessageHeight(oldestKey, 250);
    cacheMessageHeight(messageHeightKey("message-new", false), 100);

    expect(getCachedMessageHeight(oldestKey)).toBe(250);
    expect(
      getCachedMessageHeight(messageHeightKey("message-1", false)),
    ).toBeNull();
  });
});
