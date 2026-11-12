// @vitest-environment happy-dom
import type { PuckContext, SlotComponent } from "@puckeditor/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { config as pageEditorConfig } from "../config";
import { editorConfigForRegion } from "../region/editor-config";
import { renderConfigForRegion } from "../region/render-config";
import { PuckRender, renderComponentConfigs } from "../render-config";
import { BLOCK_DEFAULT_PROPS } from "../blocks/defaults";
import { mergePropsWithDefaults } from "../lib/merge-props";

import { installPuckBaseStyles } from "./helpers/puck-base-css";

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

/**
 * The containing-block rule lives in `puck-base.css`, so the computed-style
 * assertion below needs the real stylesheet in the document. `happy-dom`
 * applies document stylesheets on `getComputedStyle`, which is how the canvas
 * and the published page are compared on the rule itself instead of on the
 * class string that carries it.
 */
let removeStyles: (() => void) | null = null;
let styleHost: HTMLDivElement | null = null;

beforeAll(() => {
  removeStyles = installPuckBaseStyles();
  styleHost = document.createElement("div");
  document.body.appendChild(styleHost);
});

afterAll(() => {
  removeStyles?.();
  styleHost?.remove();
});

function renderIntoDom(markup: string) {
  if (!styleHost) throw new Error("style host is not installed");

  styleHost.innerHTML = markup;

  const root = styleHost.firstElementChild as HTMLElement | null;

  if (!root) throw new Error("markup has no block root");

  return { root, position: window.getComputedStyle(root).position };
}

/** The box an absolutely positioned element would resolve offsets against. */
function positionedAncestor(element: Element) {
  let current = element.parentElement;

  while (current) {
    if (window.getComputedStyle(current).position !== "static") return current;
    current = current.parentElement;
  }

  return null;
}

const SlotStub = ({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) => <div data-slot="stub" className={className} style={style} />;

/**
 * A slot whose content is not part of the block contract: it only carries an
 * absolutely positioned child, so the test can observe which box becomes its
 * containing block.
 */
const AbsoluteChildSlot: SlotComponent = (props) => (
  <div className={props?.className} style={props?.style}>
    <span data-abs-child style={{ position: "absolute", top: 0, left: 0 }} />
  </div>
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
      decoration: { desktop: { borderRightWidth: "1px" } },
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
      content: {
        title: "Resources",
        links: [{ link: { type: "external", url: "/blog/", label: "Blog" } }],
      },
      dimension: { desktop: { marginTop: "12px" } },
      typography: { desktop: { fontSize: "0.875rem" } },
    },
  },
  {
    name: "TopBar",
    region: "HEADER",
    props: {
      content: SlotStub,
      settings: { dismissible: false },
      dimension: { desktop: { paddingTop: "8px" } },
      decoration: { desktop: { backgroundColor: "var(--accent)" } },
    },
  },
  {
    name: "SearchBar",
    region: "HEADER",
    props: {
      content: { placeholder: "Search", variant: "inline" },
      dimension: { desktop: { marginTop: "8px" } },
      decoration: { desktop: { backgroundColor: "var(--accent)" } },
    },
  },
];

function renderThrough(
  render: (props: Record<string, unknown>) => React.ReactNode,
  props: Record<string, unknown>,
  puck: PuckContext = PUCK,
  defaults?: object,
) {
  const client = new QueryClient();
  const resolvedProps = defaults
    ? mergePropsWithDefaults(defaults, props)
    : props;

  return renderToStaticMarkup(
    <QueryClientProvider client={client}>
      {render({ ...resolvedProps, id: "pipeline-test", puck })}
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

/**
 * Render one case through both configs.
 *
 * The editor render applies the shared defaults by hand because this seam calls
 * the render function directly instead of mounting the canvas. It receives a
 * drag ref on purpose: the two paths must stay identical once Puck hands the
 * ref over, so the editor version of the props is what this parity test
 * compares.
 */
function renderCase({ name, props, region }: SharedCase) {
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

  const defaults = BLOCK_DEFAULT_PROPS[name];

  return {
    editorHtml: renderThrough(
      editorRender,
      props,
      { ...PUCK, dragRef: () => undefined },
      defaults,
    ),
    publicHtml: renderThrough(publicRender, props),
  };
}

/**
 * The two render paths of a case, named so a failing assertion says which one
 * disagreed.
 */
function pathsOf({ editorHtml, publicHtml }: ReturnType<typeof renderCase>) {
  return [
    ["canvas", editorHtml],
    ["page", publicHtml],
  ] as const;
}

describe("consolidated Puck render pipeline", () => {
  const assertParity = (testCase: SharedCase) => {
    const { nonEmpty = true } = testCase;
    const { editorHtml, publicHtml } = renderCase(testCase);

    if (nonEmpty) {
      expect(editorHtml).not.toBe("");
    }
    expect(publicHtml).toBe(editorHtml);
  };

  it.each(SHARED_CASES)(
    "$name renders identical markup in the editor and public configs",
    assertParity,
  );

  const MINIMAL_CASES: SharedCase[] = [
    {
      name: "Container",
      props: { items: SlotStub },
    },
    {
      name: "Flex",
      props: { items: SlotStub },
    },
    {
      name: "Grid",
      props: { items: SlotStub },
    },
    {
      name: "Image",
      props: {},
    },
    {
      name: "Form",
      props: {},
    },
    {
      name: "Separator",
      props: {},
    },
    {
      name: "Icon",
      nonEmpty: false,
      props: {},
    },
    {
      name: "Heading",
      props: {},
    },
    {
      name: "Text",
      props: {},
    },
    {
      name: "Link",
      props: {},
    },
    {
      name: "LinkList",
      region: "FOOTER",
      props: {},
    },
    {
      name: "TopBar",
      region: "HEADER",
      props: { content: SlotStub },
    },
    {
      name: "SearchBar",
      region: "HEADER",
      props: {},
    },
  ];

  it.each(MINIMAL_CASES)(
    "$name renders identical markup from default props in editor and public configs",
    assertParity,
  );

  it.each([
    { name: "Heading", props: { text: "" } },
    { name: "Text", props: { text: "" } },
  ] satisfies SharedCase[])(
    "$name renders the same empty container in both configs",
    (testCase) => {
      const { editorHtml, publicHtml } = renderCase(testCase);

      expect(editorHtml).toBe(publicHtml);
      expect(editorHtml).toContain("puck-rich-text");
      expect(editorHtml).not.toContain("data-placeholder");
    },
  );

  it("renders a Link that caps its natural width identically in both configs", () => {
    // The Link's block base width must not be replaced by the implied fill in
    // either path: the canvas and the page read the same width function.
    const { editorHtml, publicHtml } = renderCase({
      name: "Link",
      props: {
        link: {
          type: "external",
          url: "https://example.com/",
          label: "Example",
        },
        dimension: { desktop: { maxWidth: "30rem" } },
      },
    });

    expect(editorHtml).toContain("--w-d:fit-content");
    expect(editorHtml).not.toContain("--w-d:100%");
    expect(publicHtml).toBe(editorHtml);
  });

  /**
   * The block root is the containing block for absolutely positioned
   * descendants. Puck sets `position: relative` on that node while editing, so
   * the published page needs the declaration too; otherwise the same child
   * resolves against a different box in each path.
   *
   * Icon is skipped: its `DynamicIcon` has no static markup, so the computed
   * style is asserted by the DOM test in `inline-roots.test.tsx` instead.
   */
  const MARKUP_CASES = SHARED_CASES.filter((entry) => entry.nonEmpty !== false);

  it.each(MARKUP_CASES)(
    "$name block root is position: relative in the canvas and on the page",
    (testCase) => {
      for (const [path, markup] of pathsOf(renderCase(testCase))) {
        const { root, position } = renderIntoDom(markup);

        expect(root.classList.contains("puck-block-root")).toBe(true);
        expect(
          position,
          `${testCase.name} root on the ${path} must be the containing block`,
        ).toBe("relative");
      }
    },
  );

  it("resolves an absolutely positioned descendant against the block root in both paths", () => {
    const rendered = renderCase({
      name: "Container",
      props: {
        items: AbsoluteChildSlot,
        dimension: { desktop: { paddingTop: "40px" } },
      },
    });

    for (const [path, markup] of pathsOf(rendered)) {
      const { root } = renderIntoDom(markup);
      const child = root.querySelector("[data-abs-child]");

      expect(child, `no absolute child on the ${path}`).not.toBeNull();
      expect(
        positionedAncestor(child!),
        `absolute child on the ${path} resolved against a different box`,
      ).toBe(root);
    }
  });

  it("assigns the shared defaults entry to every editor component", () => {
    const editorConfigs = [
      pageEditorConfig,
      editorConfigForRegion("HEADER"),
      editorConfigForRegion("FOOTER"),
    ];

    type EditorComponent = { defaultProps?: object };
    const editorComponents = new Map<string, EditorComponent>();

    for (const config of editorConfigs) {
      for (const [name, component] of Object.entries(config.components)) {
        editorComponents.set(name, component as unknown as EditorComponent);
      }
    }

    for (const [name, defaults] of Object.entries(BLOCK_DEFAULT_PROPS)) {
      expect(
        editorComponents.get(name),
        `${name} is missing from the editor configs`,
      ).toBeDefined();
      // Identity, not deep equality: a component that restates the literal
      // would build a second object and silently diverge from the public
      // render defaults.
      expect(
        editorComponents.get(name)?.defaultProps,
        `${name} does not use the shared defaults entry`,
      ).toBe(defaults);
    }

    for (const [name, component] of editorComponents) {
      if (name in BLOCK_DEFAULT_PROPS) continue;

      expect(
        component?.defaultProps,
        `${name} keeps a private default outside BLOCK_DEFAULT_PROPS`,
      ).toBeUndefined();
    }
  });

  it("emits no editor-only layout classes for Container, Flex and Grid", () => {
    const config = renderConfigForRegion("HEADER");

    for (const name of ["Container", "Flex", "Grid"] as const) {
      const sharedCase = SHARED_CASES.find((entry) => entry.name === name);

      if (!sharedCase) throw new Error(`${name} case is missing`);

      const render = config.components[name].render as unknown as (
        props: Record<string, unknown>,
      ) => React.ReactNode;

      const editorHtml = renderThrough(render, sharedCase.props, {
        ...PUCK,
        isEditing: true,
      });
      const publicHtml = renderThrough(render, sharedCase.props);

      expect(editorHtml).not.toContain("flex-1");
      expect(publicHtml).not.toContain("flex-1");
      expect(editorHtml).toBe(publicHtml);
    }
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
                  content: {
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
                type: "TopBar",
                props: {
                  id: "top-bar",
                  settings: { dismissible: false },
                  content: [
                    {
                      type: "Text",
                      props: { id: "top-bar-text", text: "Sale" },
                    },
                  ],
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
