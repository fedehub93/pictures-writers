"use client";

import "client-only";

import { useEffect } from "react";

import { useSidebar } from "@/shared/ui/sidebar";

import { PuckEditor } from "@/puck/editor-shell";
import { editorConfigForRegion } from "@/puck/region-editor-config";

import { EMPTY_PUCK_DATA } from "../../constants";
import { SITE_REGION_LABELS } from "../../lib/region-presentation";
import { SiteRegionHeaderActions } from "../components/site-region-header-actions";
import type { SiteRegionEditorData } from "../types";

export const SiteRegionEditorView = ({
  region,
}: {
  region: SiteRegionEditorData;
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
      header={{
        title: SITE_REGION_LABELS[region.key],
        actions: <SiteRegionHeaderActions region={region} />,
      }}
    />
  );
};
