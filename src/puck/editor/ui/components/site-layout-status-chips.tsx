"use client";
import "client-only";

import type { SiteLayoutPreview } from "@/modules/site-regions/lib/site-layout-preview";
import { getSiteLayoutStatusChips } from "@/modules/site-regions/lib/site-layout-status";

/**
 * Shows which Site regions in the page editor canvas are not the published
 * ones. Rendered next to the page title in the builder header bar; nothing is
 * drawn while the Site layout preview is hidden or every region is live.
 *
 * Hidden below `md` like the page title it sits beside, so the narrow header
 * bar keeps its space for the canvas controls.
 */
export const SiteLayoutStatusChips = ({
  showSiteLayout,
  siteLayout,
}: {
  showSiteLayout: boolean;
  siteLayout?: SiteLayoutPreview;
}) => {
  if (!showSiteLayout || !siteLayout) return null;

  const chips = getSiteLayoutStatusChips(siteLayout);

  if (chips.length === 0) return null;

  return (
    <span className="hidden items-center gap-1 md:flex">
      {chips.map((chip) => (
        <span
          key={chip.label}
          title={chip.title}
          className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground"
        >
          {chip.label}
        </span>
      ))}
    </span>
  );
};
