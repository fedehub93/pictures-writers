import type { Data } from "@puckeditor/core";
import { describe, expect, it } from "vitest";

import type { SiteLayoutPreview } from "../site-layout-preview";
import {
  getSiteLayoutStatusChip,
  getSiteLayoutStatusChips,
} from "../site-layout-status";

const document = { root: {}, content: [] } as unknown as Data;

function preview(
  header: SiteLayoutPreview["header"]["state"],
  footer: SiteLayoutPreview["footer"]["state"],
): SiteLayoutPreview {
  return {
    header: { data: document, state: header },
    footer: { data: document, state: footer },
  };
}

describe("getSiteLayoutStatusChip", () => {
  it("returns no chip for a live region", () => {
    expect(getSiteLayoutStatusChip("header", "live")).toBeNull();
    expect(getSiteLayoutStatusChip("footer", "live")).toBeNull();
  });

  it("names the region and the draft state", () => {
    expect(getSiteLayoutStatusChip("header", "draft")).toEqual({
      label: "Header: bozza",
      title:
        "Bozza: questa regione non è visibile ai visitatori finché non viene pubblicata.",
    });
    expect(getSiteLayoutStatusChip("footer", "draft")).toMatchObject({
      label: "Footer: bozza",
    });
  });

  it("names the region and the default state", () => {
    expect(getSiteLayoutStatusChip("header", "default")).toEqual({
      label: "Header: predefinito",
      title:
        "Predefinito: è il fallback del codice usato finché la regione non viene pubblicata.",
    });
    expect(getSiteLayoutStatusChip("footer", "default")).toMatchObject({
      label: "Footer: predefinito",
    });
  });
});

describe("getSiteLayoutStatusChips", () => {
  it("returns nothing when both regions are live", () => {
    expect(getSiteLayoutStatusChips(preview("live", "live"))).toEqual([]);
  });

  it("returns one chip per region that is not live", () => {
    expect(getSiteLayoutStatusChips(preview("draft", "default"))).toEqual([
      getSiteLayoutStatusChip("header", "draft"),
      getSiteLayoutStatusChip("footer", "default"),
    ]);
  });

  it("returns only the header chip when the footer is live", () => {
    expect(getSiteLayoutStatusChips(preview("default", "live"))).toHaveLength(1);
  });

  it("returns only the footer chip when the header is live", () => {
    expect(getSiteLayoutStatusChips(preview("live", "draft"))).toEqual([
      getSiteLayoutStatusChip("footer", "draft"),
    ]);
  });
});
