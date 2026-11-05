import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  dismissAnnouncement,
  getAnnouncementStorageKey,
  isAnnouncementDismissed,
  subscribeToAnnouncement,
} from "../blocks/AnnouncementBar/lib/storage";

function createStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe("announcement bar dismissal storage", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      localStorage: createStorage(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("remembers dismissals per block id and copy", () => {
    expect(isAnnouncementDismissed("header-bar", "Sale")).toBe(false);

    dismissAnnouncement("header-bar", "Sale");

    expect(isAnnouncementDismissed("header-bar", "Sale")).toBe(true);
    expect(isAnnouncementDismissed("other-bar", "Sale")).toBe(false);
    expect(isAnnouncementDismissed("header-bar", "New message")).toBe(false);
  });

  it("uses a namespaced key that changes with the copy", () => {
    const first = getAnnouncementStorageKey("header-bar", "Sale");
    const second = getAnnouncementStorageKey("header-bar", "New message");

    expect(first).toMatch(/^puck:announcement-bar:dismissed:header-bar:/);
    expect(second).toMatch(/^puck:announcement-bar:dismissed:header-bar:/);
    expect(first).not.toBe(second);
  });

  it("notifies same-tab subscribers only while subscribed", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToAnnouncement(
      "header-bar",
      "Sale",
      listener,
    );

    dismissAnnouncement("header-bar", "Sale");
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    dismissAnnouncement("header-bar", "Sale");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("does not throw when localStorage is unavailable", () => {
    vi.stubGlobal("window", {
      get localStorage() {
        throw new Error("blocked");
      },
    });

    expect(() => dismissAnnouncement("header-bar", "Sale")).not.toThrow();
    expect(isAnnouncementDismissed("header-bar", "Sale")).toBe(false);
  });
});
