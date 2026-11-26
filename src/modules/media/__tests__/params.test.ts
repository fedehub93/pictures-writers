import { describe, expect, it } from "vitest";

import { loadMediaSearchParams } from "../params";

describe("loadMediaSearchParams", () => {
  it("defaults to the active view with no search and no open folder", () => {
    const params = loadMediaSearchParams({});

    expect(params).toEqual({
      search: "",
      view: "active",
      folderId: null,
    });
  });

  it("keeps search, view and folder in the parsed contract", () => {
    const params = loadMediaSearchParams({
      search: "cat",
      view: "archived",
      folderId: "campaigns",
    });

    expect(params).toEqual({
      search: "cat",
      view: "archived",
      folderId: "campaigns",
    });
  });

  it("ignores a legacy page parameter and keeps the rest of the scope", () => {
    const params = loadMediaSearchParams({
      search: "cat",
      view: "archived",
      folderId: "campaigns",
      page: "3",
    });

    expect(params).toEqual({
      search: "cat",
      view: "archived",
      folderId: "campaigns",
    });
  });
});
