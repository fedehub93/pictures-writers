"use client";

import "client-only";

import { useEffect } from "react";

import { useSidebar } from "@/shared/ui/sidebar";

import { PuckEditor } from "@/puck/editor-shell";
import type { SiteRegionMetadata } from "@/puck/metadata";
import { editorConfigForRegion } from "@/puck/region/editor-config";

import { EMPTY_PUCK_DATA } from "../../constants";
import { SITE_REGION_LABELS } from "../../lib/region-presentation";
import { SiteRegionHeaderActions } from "../components/site-region-header-actions";
import type { SiteRegionEditorData } from "../types";

export const SiteRegionEditorView = ({
  region,
  metadata,
}: {
  region: SiteRegionEditorData;
  /**
   * Installation details the canvas previews through `puck.metadata`. Read on
   * the server so no block has to fetch settings from the browser.
   */
  metadata: SiteRegionMetadata;
}) => {
  const { setOpen } = useSidebar();

  // Collapse the admin sidebar once, so the editor gets the whole viewport.
  // Intentionally mount-only: `setOpen` changes identity every time the
  // sidebar state changes, so depending on it would re-run the timer on each
  // toggle and close the sidebar right after the user opens it.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setOpen(false);
    }, 50);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only: see comment above
  }, []);

  return (
    <PuckEditor
      initialData={{
        puckData: region.version.puckData ?? EMPTY_PUCK_DATA,
      }}
      config={editorConfigForRegion(region.key)}
      metadata={metadata}
      rootLabel={SITE_REGION_LABELS[region.key]}
      header={{
        title: SITE_REGION_LABELS[region.key],
        actions: <SiteRegionHeaderActions region={region} />,
        showPreview: true,
      }}
    />
  );
};
