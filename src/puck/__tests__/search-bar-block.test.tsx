import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SearchBox } from "@/shared/components/search/search-box";

import { SearchBar } from "../blocks/SearchBar";
import { config as pageEditorConfig } from "../config";

function render(ui: React.ReactNode) {
  const client = new QueryClient();

  return renderToStaticMarkup(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

describe("SearchBar block", () => {
  it("renders the inline search input with the configured placeholder", () => {
    const html = render(
      <SearchBox placeholder="Find an article" variant="inline" />,
    );

    expect(html).toContain('placeholder="Find an article"');
    expect(html).toContain('type="search"');
  });

  it("renders only an icon trigger in the compact variant", () => {
    const html = render(
      <SearchBox placeholder="Find an article" variant="compact" />,
    );

    expect(html).toContain('aria-label="Find an article"');
    expect(html).not.toContain('type="search"');
  });

  it("is not available in the page editor palette", () => {
    expect(Object.keys(pageEditorConfig.components)).not.toContain(
      "AnnouncementBar",
    );
    expect(Object.keys(pageEditorConfig.components)).not.toContain("SearchBar");
  });

  it("exposes placeholder and variant in the editor", () => {
    expect(SearchBar.defaultProps).toEqual({
      placeholder: "Search...",
      variant: "inline",
    });
    expect(SearchBar.fields?.variant).toMatchObject({
      type: "radio",
      options: [
        { label: "Inline", value: "inline" },
        { label: "Icon button (popover)", value: "compact" },
      ],
    });
  });
});
