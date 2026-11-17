import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  dismissTopBar,
  getTopBarStorageKey,
  isTopBarDismissed,
  subscribeToTopBar,
} from "../blocks/TopBar/lib/storage";

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

describe("top bar dismissal storage", () => {
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

  it("remembers dismissals per block id", () => {
    expect(isTopBarDismissed("header-bar")).toBe(false);

    dismissTopBar("header-bar");

    expect(isTopBarDismissed("header-bar")).toBe(true);
    expect(isTopBarDismissed("other-bar")).toBe(false);
  });

  it("scopes the storage key by block id only", () => {
    expect(getTopBarStorageKey("header-bar")).toBe(
      "puck:top-bar:dismissed:header-bar",
    );
    expect(getTopBarStorageKey("language-strip")).toBe(
      "puck:top-bar:dismissed:language-strip",
    );
  });

  it("notifies same-tab subscribers only while subscribed", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToTopBar("header-bar", listener);

    dismissTopBar("header-bar");
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    dismissTopBar("header-bar");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("does not throw when localStorage is unavailable", () => {
    vi.stubGlobal("window", {
      get localStorage() {
        throw new Error("blocked");
      },
    });

    expect(() => dismissTopBar("header-bar")).not.toThrow();
    expect(isTopBarDismissed("header-bar")).toBe(false);
  });
});
