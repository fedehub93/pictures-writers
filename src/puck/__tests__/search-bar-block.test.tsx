import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SearchBox } from "@/shared/components/search/search-box";

import { SearchBar } from "../blocks/SearchBar";
import { SEARCH_BAR_DEFAULT_CONTENT } from "../blocks/SearchBar/defaults";
import { renderSearchBarBlock } from "../blocks/SearchBar/render";
import type { SearchBarBlockProps } from "../blocks/SearchBar/types";
import { config as pageEditorConfig } from "../config";

const PUCK = {
  renderDropZone: () => null,
  metadata: {},
  isEditing: false,
  dragRef: null,
};

function renderBlock(props: SearchBarBlockProps) {
  return render(
    renderSearchBarBlock({ ...props, id: "search-bar", puck: PUCK }),
  );
}

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
      "TopBar",
    );
    expect(Object.keys(pageEditorConfig.components)).not.toContain("SearchBar");
  });

  it("renders its content from the nested content object", () => {
    const html = renderBlock({
      content: { placeholder: "Find an article", variant: "inline" },
    });

    expect(html).toContain('placeholder="Find an article"');
    expect(html).toContain('type="search"');
  });

  it("applies dimension and decoration as responsive CSS custom properties", () => {
    const html = renderBlock({
      content: { placeholder: "Find an article", variant: "inline" },
      dimension: {
        desktop: { marginTop: "12px", paddingLeft: "8px" },
        tablet: { paddingBottom: "4px" },
      },
      decoration: {
        desktop: {
          backgroundColor: "var(--accent)",
          borderBottomWidth: "1px",
          borderStyle: "solid",
          borderColor: "var(--accent-foreground)",
          borderTopLeftRadius: "6px",
          opacity: "0.9",
        },
      },
    });

    expect(html).toContain("puck-dim puck-deco");
    expect(html).toContain("--mt-d:12px");
    expect(html).toContain("--pl-d:8px");
    expect(html).toContain("--pb-t:4px");
    expect(html).toContain("--bgc-d:var(--accent)");
    expect(html).toContain("--bbw-d:1px");
    expect(html).toContain("--bs-d:solid");
    expect(html).toContain("--bc-d:var(--accent-foreground)");
    expect(html).toContain("--rtl-d:6px");
    expect(html).toContain("--op-d:0.9");
  });

  it("applies the shared variables to the compact variant too", () => {
    const html = renderBlock({
      content: { placeholder: "Find an article", variant: "compact" },
      dimension: { desktop: { marginTop: "8px" } },
      decoration: { desktop: { backgroundColor: "var(--accent)" } },
    });

    expect(html).toContain("puck-dim puck-deco");
    expect(html).toContain("--mt-d:8px");
    expect(html).toContain("--bgc-d:var(--accent)");
    expect(html).toContain('aria-label="Find an article"');
    expect(html).not.toContain('type="search"');
  });

  it("keeps the spacing and surface opt-in when no values are configured", () => {
    const html = renderBlock({ content: { placeholder: "Find an article" } });

    expect(html).toContain("puck-dim puck-deco");
    expect(html).not.toContain("--bgc-d");
    expect(html).not.toContain("--mt-d");
    expect(html).toContain('placeholder="Find an article"');
  });

  it("stores the nested content default", () => {
    expect(SearchBar.defaultProps).toEqual({
      content: SEARCH_BAR_DEFAULT_CONTENT,
    });
  });

  it("exposes one Search content section and only the shared style fields", () => {
    const fields = (SearchBar.fields ?? {}) as Record<string, unknown>;

    expect(fields.content).toMatchObject({ type: "custom" });
    expect(fields).toHaveProperty("dimension");
    expect(fields).toHaveProperty("decoration");
    expect(fields).not.toHaveProperty("placeholder");
    expect(fields).not.toHaveProperty("variant");
    expect(fields).not.toHaveProperty("typography");
  });
});
