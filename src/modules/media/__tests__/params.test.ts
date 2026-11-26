import { describe, expect, it } from "vitest";

import { loadMediaSearchParams } from "../params";

describe("loadMediaSearchParams", () => {
  it("defaults to the active view with no search and no open folder", () => {
    const params = loadMediaSearchParams({});

    expect(params).toEqual({
      search: "",
      view: "active",
      folderId: null,
      sort: "created",
    });
  });

  it("keeps search, view, folder and sort in the parsed contract", () => {
    const params = loadMediaSearchParams({
      search: "cat",
      view: "archived",
      folderId: "campaigns",
      sort: "size",
    });

    expect(params).toEqual({
      search: "cat",
      view: "archived",
      folderId: "campaigns",
      sort: "size",
    });
  });

  it("ignores a legacy page parameter and keeps the rest of the scope", () => {
    const params = loadMediaSearchParams({
      search: "cat",
      view: "archived",
      folderId: "campaigns",
      sort: "name",
      page: "3",
    });

    expect(params).toEqual({
      search: "cat",
      view: "archived",
      folderId: "campaigns",
      sort: "name",
    });
  });
});
