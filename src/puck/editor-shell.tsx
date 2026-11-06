import "client-only";

import {
  Puck,
  type Config,
  type Data,
  type Metadata,
} from "@puckeditor/core";
import "@puckeditor/core/puck.css";

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
};

// Render Puck editor
export function PuckEditor({
  initialData,
  config = pageConfig,
  header,
  metadata,
}: PuckEditorProps) {
  return (
    <Puck
      config={config}
      data={initialData.puckData}
      metadata={metadata}
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
      <Editor header={header} />
    </Puck>
  );
}
