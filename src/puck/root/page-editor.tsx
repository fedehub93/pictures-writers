import type { CSSProperties, ReactNode } from "react";

import {
  Render,
  type Config,
  type Metadata,
  type PuckContext,
  type RootConfig,
} from "@puckeditor/core";

import { cn } from "@/shared/lib/utils";

import type { SiteLayoutPreview } from "@/modules/site-regions/lib/site-layout-preview";
import { getHeaderClassName } from "@/modules/site-regions/lib/header-sticky";

import { useEditorStore } from "@/puck/editor/store/use-editor-store";
import { readSiteLayoutPreview } from "@/puck/metadata";

import { RootEditor } from "./index";
import { CANVAS_TOKENS, PageRootContent } from "./render";
import type { RootProps } from "./types";

export interface PageEditorRootConfigs {
  /** Editor palette for the Header region document. */
  header: Config;
  /** Editor palette for the Footer region document. */
  footer: Config;
}

/**
 * Root used only by the page editor.
 *
 * It draws the read-only Site layout preview around the Page content. The
 * public page root (`renderRoot`) and the region editors keep their own root,
 * so the published layout and the region canvases are untouched.
 */
export function createPageEditorRoot({
  header,
  footer,
}: PageEditorRootConfigs): RootConfig<RootProps> {
  const PageEditorRoot = ({
    children,
    dimension,
    puck,
  }: RootProps & { puck?: PuckContext }) => {
    const showSiteLayout = useEditorStore((state) => state.showSiteLayout);

    return (
      <PageEditorRootUi
        headerConfig={header}
        footerConfig={footer}
        showSiteLayout={showSiteLayout}
        siteLayout={readSiteLayoutPreview(puck?.metadata)}
        metadata={puck?.metadata}
        isEditing={puck?.isEditing ?? true}
        dimension={dimension}
      >
        {children}
      </PageEditorRootUi>
    );
  };

  return {
    fields: RootEditor.fields,
    render: PageEditorRoot,
  };
}

/**
 * Site layout preview and page content for the page editor canvas.
 *
 * Exported separately from the root hook so the toggle and the read-only
 * contract can be tested without mounting Puck. `Render` creates its own
 * read-only context (`isEditing: false`, `dragRef: null`), so no
 * `data-puck-component` wrapper is added and the regions cannot be dragged.
 */
export function PageEditorRootUi({
  children,
  dimension,
  headerConfig,
  footerConfig,
  siteLayout,
  showSiteLayout,
  isEditing,
  metadata,
}: {
  children: ReactNode;
  dimension?: RootProps["dimension"];
  headerConfig: Config;
  footerConfig: Config;
  siteLayout?: SiteLayoutPreview;
  showSiteLayout: boolean;
  isEditing: boolean;
  metadata?: Metadata;
}) {
  const showPreview = showSiteLayout && Boolean(siteLayout);

  return (
    <>
      {showPreview && siteLayout && (
        <header
          style={CANVAS_TOKENS as CSSProperties}
          className={cn(
            "pointer-events-none select-none",
            // A pinned header would cover the block being edited, so the
            // editing canvas never applies the sticky positioning. It matters
            // only on a read-only surface such as interactive preview.
            !isEditing && getHeaderClassName(siteLayout.header.data),
          )}
        >
          <Render
            config={headerConfig}
            data={siteLayout.header.data}
            metadata={metadata}
          />
        </header>
      )}

      <PageRootContent dimension={dimension} isEditing={isEditing}>
        {children}
      </PageRootContent>

      {showPreview && siteLayout && (
        <footer
          style={CANVAS_TOKENS as CSSProperties}
          className="pointer-events-none select-none"
        >
          <Render
            config={footerConfig}
            data={siteLayout.footer.data}
            metadata={metadata}
          />
        </footer>
      )}
    </>
  );
}
