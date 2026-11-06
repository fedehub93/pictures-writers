import type { PuckContext } from "@puckeditor/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { config as pageEditorConfig } from "../config";
import { editorConfigForRegion } from "../region/editor-config";
import { renderConfigForRegion } from "../region/render-config";
import { PuckRender, renderComponentConfigs } from "../render-config";

/**
 * Guards the consolidated render pipeline: for every block that is safe to
 * render without the database, the editor config and the public render config
 * must produce identical markup from the same props.
 *
 * Brand, Copyright and NavbarBlock are deliberately excluded: their public
 * entry goes through a server renderer that reads Installation settings or
 * resolves CMS links, while the editor canvas must stay database-free. They
 * remain covered by their server-renderer and block UI tests.
 */
const PUCK: PuckContext = {
  renderDropZone: () => null,
  metadata: {},
  isEditing: false,
  dragRef: null,
};

const SlotStub = ({ className }: { className?: string }) => (
  <div data-slot="stub" className={className} />
);

type SharedCase = {
  name: string;
  props: Record<string, unknown>;
  /** Palette to use; page blocks leave it empty. */
  region?: "HEADER" | "FOOTER";
  /**
   * DynamicIcon renders lazily, so Icon has no static markup to assert on; it
   * is still compared for equality between the two configs.
   */
  nonEmpty?: boolean;
};

const SHARED_CASES: SharedCase[] = [
  {
    name: "Container",
    props: {
      items: SlotStub,
      layout: { desktop: { display: "flex" } },
      dimension: { desktop: { paddingTop: "12px" } },
      typography: { desktop: { fontSize: "16px" } },
      decoration: { desktop: { backgroundColor: "var(--accent)" } },
    },
  },
  {
    name: "Flex",
    props: {
      items: SlotStub,
      layout: { desktop: { display: "flex" } },
      dimension: { desktop: { paddingLeft: "8px" } },
      typography: { desktop: { fontSize: "15px" } },
      decoration: { desktop: { borderWidth: "1px" } },
    },
  },
  {
    name: "Grid",
    props: {
      items: SlotStub,
      layout: { desktop: { display: "grid" } },
      dimension: { desktop: { rowGap: "1rem" } },
      typography: { desktop: { fontWeight: "600" } },
      decoration: { desktop: { backgroundColor: "var(--muted)" } },
    },
  },
  {
    name: "Image",
    props: { image: { src: "/cover.png", alt: "Cover" } },
  },
  {
    name: "Form",
    props: { form: { id: "", content: null, gtmEventName: "" } },
  },
  {
    name: "Separator",
    props: { dimension: { desktop: { width: "100%", height: "2px" } } },
  },
  {
    name: "Icon",
    nonEmpty: false,
    props: {
      icon: { name: "star" },
      typography: { desktop: { color: "var(--primary)" } },
    },
  },
  {
    name: "Heading",
    props: {
      text: "Hello",
      typography: { desktop: { fontSize: "2rem", fontWeight: "700" } },
    },
  },
  {
    name: "Text",
    props: {
      text: "Hello\nWorld",
      dimension: { desktop: { marginTop: "12px" } },
      typography: {
        desktop: { fontSize: "18px", textAlign: "center", color: "var(--primary)" },
        tablet: { fontSize: "16px" },
      },
    },
  },
  {
    name: "Link",
    props: {
      link: {
        type: "external",
        url: "https://example.com/",
        label: "Example",
      },
    },
  },
  {
    name: "LinkList",
    region: "FOOTER",
    props: {
      title: "Resources",
      links: [{ link: { type: "external", url: "/blog/", label: "Blog" } }],
      dimension: { desktop: { marginTop: "12px" } },
      typography: { desktop: { fontSize: "0.875rem" } },
    },
  },
  {
    name: "AnnouncementBar",
    region: "HEADER",
    props: {
      text: "Sale",
      link: { type: "external", url: "/sale/", label: "Sale" },
      dismissible: false,
    },
  },
  {
    name: "SearchBar",
    region: "HEADER",
    props: { placeholder: "Search", variant: "inline" },
  },
];

function renderThrough(
  render: (props: Record<string, unknown>) => React.ReactNode,
  props: Record<string, unknown>,
  puck: PuckContext = PUCK,
) {
  const client = new QueryClient();

  return renderToStaticMarkup(
    <QueryClientProvider client={client}>
      {render({ ...props, id: "pipeline-test", puck })}
    </QueryClientProvider>,
  );
}

type RenderEntry = {
  render: (props: Record<string, unknown>) => React.ReactNode;
};

function componentsFor(region?: SharedCase["region"]) {
  if (region) {
    return {
      editor: editorConfigForRegion(region).components,
      public: renderConfigForRegion(region).components,
    };
  }

  return {
    editor: pageEditorConfig.components,
    public: renderComponentConfigs,
  };
}

describe("consolidated Puck render pipeline", () => {
  it.each(SHARED_CASES)(
    "$name renders identical markup in the editor and public configs",
    ({ name, props, region, nonEmpty = true }) => {
      const components = componentsFor(region);

      const editorRender = (
        components.editor as unknown as Record<string, RenderEntry>
      )[name]?.render;
      const publicRender = (
        components.public as unknown as Record<string, RenderEntry>
      )[name]?.render;

      if (!editorRender || !publicRender) {
        throw new Error(`${name} is missing from one of the render configs`);
      }

      const editorHtml = renderThrough(editorRender, props);
      const publicHtml = renderThrough(publicRender, props);

      if (nonEmpty) {
        expect(editorHtml).not.toBe("");
      }
      expect(publicHtml).toBe(editorHtml);
    },
  );

  it("keeps editor-only layout classes out of the public Container markup", () => {
    const container = SHARED_CASES.find((entry) => entry.name === "Container");

    if (!container) throw new Error("Container case is missing");

    const render = renderConfigForRegion("HEADER").components.Container
      .render as unknown as (props: Record<string, unknown>) => React.ReactNode;

    const editorHtml = renderThrough(render, container.props, {
      ...PUCK,
      isEditing: true,
    });
    const publicHtml = renderThrough(render, container.props);

    expect(editorHtml).toContain("flex-1");
    expect(publicHtml).not.toContain("flex-1");
  });

  it("renders Site region blocks through the public Puck render config", () => {
    const client = new QueryClient();
    const footer = renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <PuckRender
          config={renderConfigForRegion("FOOTER")}
          initialData={{
            root: { props: {} },
            content: [
              {
                type: "LinkList",
                props: {
                  id: "footer-links",
                  title: "Resources",
                  links: [
                    {
                      link: {
                        type: "external",
                        url: "/blog/",
                        label: "Blog",
                      },
                    },
                  ],
                },
              },
            ],
          }}
        />
      </QueryClientProvider>,
    );
    const header = renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <PuckRender
          config={renderConfigForRegion("HEADER")}
          initialData={{
            root: { props: {} },
            content: [
              {
                type: "AnnouncementBar",
                props: {
                  id: "announcement",
                  text: "Sale",
                  dismissible: false,
                },
              },
            ],
          }}
        />
      </QueryClientProvider>,
    );

    expect(footer).toContain(">Resources<");
    expect(footer).toContain('href="/blog"');
    expect(header).toContain("Sale");
  });
});
