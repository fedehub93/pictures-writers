"use client";

import { useEffect } from "react";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";
import { useSidebar } from "@/shared/ui/sidebar";

import type { SiteLayoutPreview } from "@/modules/site-regions/lib/site-layout-preview";

import { PuckEditor } from "@/puck/editor-shell";
import type { SiteRegionMetadata } from "@/puck/metadata";

import { useSuspensePage } from "../../hooks/use-pages";

import { INITIAL_PUCK_DATA } from "../../constants";

interface PageBuilderViewProps {
  rootId: string;
  /**
   * Header and Footer documents to preview around the Page. Read on the
   * server so the builder never fetches a region document from the browser.
   */
  siteLayout: SiteLayoutPreview;
  /**
   * Installation details the Site layout preview uses to render the Brand and
   * Copyright blocks, exactly like the region editors.
   */
  metadata: SiteRegionMetadata;
}

export const PageBuilderView = ({
  rootId,
  siteLayout,
  metadata,
}: PageBuilderViewProps) => {
  const { data } = useSuspensePage(rootId);
  const { setOpen } = useSidebar();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setOpen(false);
    }, 50);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <PuckEditor
      initialData={{
        puckData: data.puckData ?? INITIAL_PUCK_DATA,
      }}
      siteLayout={siteLayout}
      metadata={metadata}
    />
  );
};

export const PageBuilderViewLoading = () => {
  return (
    <LoadingState
      title="Loading Page"
      description="This may take a few seconds"
    />
  );
};

export const PageBuilderViewError = () => {
  return <ErrorState title="Error Page" description="Something went wrong" />;
};
