import type { Data } from "@puckeditor/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type {
  SiteLayoutPreview,
  SiteLayoutPreviewState,
} from "@/modules/site-regions/lib/site-layout-preview";

import { SiteLayoutStatusChips } from "../editor/ui/components/site-layout-status-chips";

const document = { root: {}, content: [] } as unknown as Data;

function preview(
  header: SiteLayoutPreviewState,
  footer: SiteLayoutPreviewState,
): SiteLayoutPreview {
  return {
    header: { data: document, state: header },
    footer: { data: document, state: footer },
  };
}

function render({
  showSiteLayout = true,
  siteLayout,
}: {
  showSiteLayout?: boolean;
  siteLayout?: SiteLayoutPreview;
}) {
  return renderToStaticMarkup(
    <SiteLayoutStatusChips
      showSiteLayout={showSiteLayout}
      siteLayout={siteLayout}
    />,
  );
}

describe("SiteLayoutStatusChips", () => {
  it("renders nothing when the chrome is hidden", () => {
    expect(
      render({ showSiteLayout: false, siteLayout: preview("draft", "draft") }),
    ).toBe("");
  });

  it("renders nothing when there is no Site layout preview", () => {
    expect(render({})).toBe("");
  });

  it("renders nothing when both regions are live", () => {
    expect(render({ siteLayout: preview("live", "live") })).toBe("");
  });

  it("renders both chips with their explanations", () => {
    const html = render({ siteLayout: preview("draft", "default") });

    expect(html).toContain("Header: bozza");
    expect(html).toContain("Footer: predefinito");
    expect(html).toContain(
      'title="Bozza: questa regione non è visibile ai visitatori finché non viene pubblicata."',
    );
    expect(html).toContain(
      'title="Predefinito: è il fallback del codice usato finché la regione non viene pubblicata."',
    );
  });

  it("keeps the chip visually secondary to the page title", () => {
    const html = render({ siteLayout: preview("draft", "live") });

    expect(html).toContain("text-xs");
    expect(html).toContain("text-muted-foreground");
  });
});
