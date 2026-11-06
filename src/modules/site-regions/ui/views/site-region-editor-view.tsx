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

  useEffect(() => {
    const timeout = setTimeout(() => {
      setOpen(false);
    }, 50);

    return () => clearTimeout(timeout);
  }, [setOpen]);

  return (
    <PuckEditor
      initialData={{
        puckData: region.version.puckData ?? EMPTY_PUCK_DATA,
      }}
      config={editorConfigForRegion(region.key)}
      metadata={metadata}
      header={{
        title: SITE_REGION_LABELS[region.key],
        actions: <SiteRegionHeaderActions region={region} />,
        showPreview: true,
      }}
    />
  );
};
