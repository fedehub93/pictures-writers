import type { Config, PuckContext } from "@puckeditor/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { config as pageEditorConfig } from "../config";
import { RootLayoutField } from "../fields/layout";
import { LayoutView } from "../fields/layout/ui/view/layout";
import { editorConfigForRegion } from "../region/editor-config";
import { RootEditor } from "../root";
import { HeaderRootEditor } from "../root/header";
import { renderRoot } from "../root/render";
import type { RootProps } from "../root/types";

const PUBLIC_PUCK: PuckContext = {
  renderDropZone: () => null,
  metadata: {},
  isEditing: false,
  dragRef: null,
};

function renderPageRoot(props: Partial<Omit<RootProps, "children">> = {}) {
  return renderToStaticMarkup(
    <>
      {renderRoot({
        children: <div data-page>Page content</div>,
        puck: PUBLIC_PUCK,
        ...props,
      })}
    </>,
  );
}

function rootFields(root: Config["root"] | undefined) {
  return (root?.fields ?? {}) as Record<string, unknown>;
}

describe("root surface render", () => {
  it("keeps the single wrapper and the block display for an unauthored root", () => {
    const html = renderPageRoot();

    expect(html.startsWith('<div class="puck-dim puck-layout"')).toBe(true);
    expect(html).toContain("--disp-d:block");
    expect(html).not.toContain("puck-display");
    expect(html).not.toContain("puck-deco");
  });

  it("adds no decoration class for an empty decoration value", () => {
    const html = renderPageRoot({ decoration: {} });

    expect(html).toContain("puck-dim puck-layout");
    expect(html).not.toContain("puck-deco");
    expect(html).not.toContain("--bgc-");
  });

  it("puts the authored layout variables on the root wrapper", () => {
    const html = renderPageRoot({
      layout: {
        desktop: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "end",
          rowGap: "2rem",
        },
        tablet: { display: "block", gridTemplateColumns: "2fr" },
        mobile: { display: "flex" },
      },
    });

    expect(html).toContain("--disp-d:flex");
    expect(html).toContain("--fd-d:column");
    expect(html).toContain("--jc-d:center");
    expect(html).toContain("--ai-d:end");
    expect(html).toContain("--rgap-d:2rem");
    expect(html).toContain("--disp-t:block");
    expect(html).toContain("--gtc-t:1fr 1fr");
    expect(html).toContain("--disp-m:flex");
    expect(html).toContain("puck-layout");
  });

  it("paints the authored decoration on the root wrapper", () => {
    const html = renderPageRoot({
      decoration: {
        desktop: {
          backgroundColor: "#101010",
          opacity: "0.9",
          borderTopWidth: "2px",
          borderStyle: "solid",
          borderColor: "#ffffff",
          borderTopLeftRadius: "12px",
        },
        mobile: { backgroundColor: "#000000" },
      },
    });

    expect(html).toContain("puck-deco");
    expect(html).toContain("--bgc-d:#101010");
    expect(html).toContain("--op-d:0.9");
    expect(html).toContain("--btw-d:2px");
    expect(html).toContain("--bs-d:solid");
    expect(html).toContain("--bc-d:#ffffff");
    expect(html).toContain("--rtl-d:12px");
    expect(html).toContain("--bgc-m:#000000");
  });

  it("adds no extra DOM element", () => {
    const html = renderPageRoot();

    expect((html.match(/<div/g) ?? []).length).toBe(2);
    expect(html).toContain('data-page="true"');
  });
});

describe("root surface fields", () => {
  it("exposes Layout, Dimension and Decoration on the page root in that order", () => {
    const fields = rootFields(pageEditorConfig.root);
    const keys = Object.keys(fields);

    expect(fields).toHaveProperty("layout");
    expect(fields).toHaveProperty("dimension");
    expect(fields).toHaveProperty("decoration");
    expect(keys.indexOf("layout")).toBeLessThan(keys.indexOf("dimension"));
    expect(keys.indexOf("dimension")).toBeLessThan(keys.indexOf("decoration"));
  });

  it("keeps the surface fields on the Header and Footer roots", () => {
    for (const key of ["HEADER", "FOOTER"] as const) {
      const fields = rootFields(editorConfigForRegion(key).root);

      expect(fields, key).toHaveProperty("layout");
      expect(fields, key).toHaveProperty("dimension");
      expect(fields, key).toHaveProperty("decoration");
    }
  });

  it("keeps the sticky switch on the Header root", () => {
    const fields = rootFields(HeaderRootEditor);

    expect(fields).toHaveProperty("sticky");
    expect(fields).toHaveProperty("layout");
    expect(fields).toHaveProperty("decoration");
  });

  it("does not expose the inert title on any root", () => {
    expect(rootFields(RootEditor)).not.toHaveProperty("title");
    expect(rootFields(HeaderRootEditor)).not.toHaveProperty("title");
    expect(rootFields(pageEditorConfig.root)).not.toHaveProperty("title");
    expect(rootFields(editorConfigForRegion("FOOTER").root)).not.toHaveProperty(
      "title",
    );
  });

  it("wires the no-hidden variant on every root", () => {
    expect(rootFields(RootEditor).layout).toBe(RootLayoutField);
    expect(rootFields(HeaderRootEditor).layout).toBe(RootLayoutField);
    expect(rootFields(pageEditorConfig.root).layout).toBe(RootLayoutField);
    expect(rootFields(editorConfigForRegion("FOOTER").root).layout).toBe(
      RootLayoutField,
    );
  });

  it("shares the root fields through the RootEditor", () => {
    expect(rootFields(HeaderRootEditor)).toMatchObject({
      layout: rootFields(RootEditor).layout,
      dimension: rootFields(RootEditor).dimension,
      decoration: rootFields(RootEditor).decoration,
    });
  });
});

describe("root Layout field", () => {
  function renderLayoutView(allowHidden?: boolean) {
    return renderToStaticMarkup(
      <LayoutView
        currentValues={{}}
        renderValues={{}}
        resetProp={() => undefined}
        onUpdateDisplay={() => undefined}
        onUpdate={() => undefined}
        allowHidden={allowHidden}
      />,
    );
  }

  it("offers Block, Flex and Grid only when hidden is not allowed", () => {
    const html = renderLayoutView(false);

    expect(html).toContain("Block");
    expect(html).toContain("Flex");
    expect(html).toContain("Grid");
    expect(html).not.toContain("None");
  });

  it("keeps the None option for the block variants", () => {
    expect(renderLayoutView()).toContain("None");
  });
});
