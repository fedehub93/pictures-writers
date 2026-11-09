import "client-only";

import {
  Puck,
  type Config,
  type Data,
  type Metadata,
} from "@puckeditor/core";
import "@puckeditor/core/puck.css";

import type { SiteLayoutPreview } from "@/modules/site-regions/lib/site-layout-preview";

import { config as pageConfig } from "./config";
import { BREAKPOINTS } from "./utils/breakpoints";
import { viewports } from "./utils/viewports";
import { Editor, type EditorHeaderProps } from "./editor/ui/view/editor";

export type PuckEditorProps = {
  initialData: {
    puckData: Data;
  };
  /**
   * Editor palette. Defaults to the page palette so existing callers keep
   * editing pages unchanged.
   */
  config?: Config;
  /**
   * Optional header override for callers that do not edit a Page (the Site
   * region editor provides its own title and save/publish actions).
   */
  header?: EditorHeaderProps;
  /**
   * Data the canvas exposes to blocks through `puck.metadata`. The Site region
   * editor uses it to preview Installation details without a browser fetch.
   */
  metadata?: Metadata;
  /**
   * Header and Footer documents the page editor draws around the Page content.
   * Region editors do not pass it, so their canvases stay unchanged.
   */
  siteLayout?: SiteLayoutPreview;
};

// Render Puck editor
export function PuckEditor({
  initialData,
  config = pageConfig,
  header,
  metadata,
  siteLayout,
}: PuckEditorProps) {
  // `siteLayout` travels through Puck metadata: the page editor root is the
  // only root that reads it, and blocks keep receiving the existing values.
  const editorMetadata = siteLayout ? { ...metadata, siteLayout } : metadata;

  return (
    <Puck
      config={config}
      data={initialData.puckData}
      metadata={editorMetadata}
      viewports={viewports}
      ui={{
        viewports: {
          current: {
            width: BREAKPOINTS.desktop.puckCanvasWidth,
            height: "auto",
          },
          options: viewports,
          controlsVisible: true,
        },
      }}
    >
      <Editor header={header} siteLayout={siteLayout} />
    </Puck>
  );
}
