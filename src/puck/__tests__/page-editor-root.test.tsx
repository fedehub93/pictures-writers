import type { Config, Data, PuckContext } from "@puckeditor/core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import type { SiteLayoutPreview } from "@/modules/site-regions/lib/site-layout-preview";

import { config as pageEditorConfig } from "../config";
import { useEditorStore } from "../editor/store/use-editor-store";
import { renderRoot } from "../root/render";
import { PageEditorRootUi } from "../root/page-editor";

/**
 * The Site layout preview configs are page-editor internals; the test builds its own probe
 * root so it can observe the context the second Puck tree receives without
 * depending on block markup. Nested blocks in Puck's render tree only receive
 * a reduced `puck` object, while the root receives the full read-only context.
 */
const ProbeRoot = ({
  children,
  puck,
}: {
  children: React.ReactNode;
  puck?: PuckContext;
}) => (
  <>
    <span data-probe>
      {String(puck?.isEditing)}:{String(puck?.metadata?.siteName ?? "")}
    </span>
    {children}
  </>
);

const probeConfig = {
  components: {},
  root: {
    render: ProbeRoot,
  },
} as unknown as Config;

function textDocument(text: string, rootProps: Record<string, unknown> = {}) {
  return {
    root: { props: rootProps },
    content: [{ type: "Text", props: { id: `text-${text}`, text } }],
  } as unknown as Data;
}

function probeDocument() {
  return { root: {}, content: [] } as unknown as Data;
}

function previewLayout({
  header,
  footer,
}: {
  header?: Data;
  footer?: Data;
}): SiteLayoutPreview {
  return {
    header: { data: header ?? textDocument("Header content"), state: "live" },
    footer: { data: footer ?? textDocument("Footer content"), state: "live" },
  };
}

function renderUi({
  showSiteLayout = true,
  isEditing = true,
  ...overrides
}: {
  showSiteLayout?: boolean;
  isEditing?: boolean;
  headerConfig?: Config;
  footerConfig?: Config;
  siteLayout?: SiteLayoutPreview;
  metadata?: Record<string, unknown>;
  children?: React.ReactNode;
}) {
  return renderToStaticMarkup(
    <PageEditorRootUi
      headerConfig={overrides.headerConfig ?? probeConfig}
      footerConfig={overrides.footerConfig ?? probeConfig}
      siteLayout={overrides.siteLayout ?? previewLayout({})}
      showSiteLayout={showSiteLayout}
      isEditing={isEditing}
      metadata={overrides.metadata}
    >
      {overrides.children ?? <div data-page>Page content</div>}
    </PageEditorRootUi>,
  );
}

afterEach(() => {
  useEditorStore.getState().setShowSiteLayout(true);
});

describe("page editor root Site layout preview", () => {
  it("draws the header and footer around the page when the toggle is on", () => {
    const html = renderUi({});

    expect(html).toContain("<header");
    expect(html).toContain("</header>");
    expect(html).toContain("<footer");
    expect(html).toContain("</footer>");
    expect(html.indexOf("<header")).toBeLessThan(html.indexOf("Page content"));
    expect(html.indexOf("Page content")).toBeLessThan(html.indexOf("<footer"));
  });

  it("draws nothing when the toggle is off", () => {
    const html = renderUi({ showSiteLayout: false });

    expect(html).not.toContain("<header");
    expect(html).not.toContain("<footer");
    expect(html).toContain("Page content");
  });

  it("keeps the page content in the existing root wrapper", () => {
    const html = renderUi({ showSiteLayout: false });

    expect(html).toContain('class="puck-dim"');
  });

  it("adds no Puck component wrapper around the Site layout preview", () => {
    const html = renderUi({});

    expect(html).not.toContain("data-puck-component");
  });

  it("renders the Site layout preview tree read-only with the Installation metadata", () => {
    const html = renderUi({
      headerConfig: probeConfig,
      footerConfig: probeConfig,
      siteLayout: {
        header: { data: probeDocument(), state: "live" },
        footer: { data: probeDocument(), state: "live" },
      },
      metadata: { siteName: "Acme" },
    });

    expect(html).toContain("false:Acme");
    // Both regions get the same read-only context.
    expect(html.match(/false:Acme/g)).toHaveLength(2);
  });

  it("applies the canvas design tokens to the Site layout preview wrappers", () => {
    const html = renderUi({});

    expect(html).toContain("--spacing:0.25rem");
    expect(html).toContain("--radius:0.5rem");
  });

  it("never pins the header in the editing canvas", () => {
    const stickyHeader = textDocument("Header", { sticky: true });
    const html = renderUi({
      isEditing: true,
      siteLayout: previewLayout({ header: stickyHeader }),
    });

    expect(html).not.toContain("sticky top-0 z-40");
  });

  it("pins the header on a read-only surface", () => {
    const stickyHeader = textDocument("Header", { sticky: true });
    const html = renderUi({
      isEditing: false,
      siteLayout: previewLayout({ header: stickyHeader }),
    });

    expect(html).toContain("sticky top-0 z-40");
  });

  it("defaults the session toggle to on without persisting it", () => {
    expect(useEditorStore.getInitialState().showSiteLayout).toBe(true);

    useEditorStore.getState().setShowSiteLayout(false);

    expect(useEditorStore.getState().showSiteLayout).toBe(false);
  });
});

describe("page editor root wiring", () => {
  const PUCK: PuckContext = {
    renderDropZone: () => null,
    metadata: {},
    isEditing: true,
    dragRef: null,
  };

  function renderPageRoot(layout?: SiteLayoutPreview) {
    const RootRender = pageEditorConfig.root?.render as unknown as
      | React.ComponentType<{ id: string; puck: PuckContext }>
      | undefined;

    if (!RootRender) throw new Error("page editor root has no render");

    return renderToStaticMarkup(
      createElement(
        RootRender,
        {
          id: "puck-root",
          puck: {
            ...PUCK,
            metadata: layout ? { siteLayout: layout } : {},
          },
        },
        <div data-page>Page content</div>,
      ),
    );
  }

  it("draws the Site layout preview on the page editor root by default", () => {
    const html = renderPageRoot(previewLayout({}));

    expect(html).toContain("<header");
    expect(html).toContain("<footer");
    expect(html).toContain("Header content");
    expect(html).toContain("Footer content");
  });

  it("renders the page without the Site layout preview when the layout payload is missing", () => {
    const html = renderPageRoot();

    expect(html).not.toContain("<header");
    expect(html).not.toContain("<footer");
    expect(html).toContain("Page content");
  });

  it("never emits the Site layout preview from the public page root", () => {
    const html = renderToStaticMarkup(
      <>
        {renderRoot({
          children: <div data-page>Page content</div>,
          puck: PUCK,
        })}
      </>,
    );

    expect(html).not.toContain("<header");
    expect(html).not.toContain("<footer");
  });
});
