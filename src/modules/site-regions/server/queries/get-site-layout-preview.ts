import "server-only";

import type { SiteRegionKey } from "@/generated/prisma";
import { getAuthorizedUser } from "@/shared/lib/authorization";
import { hasPermission, PERMISSIONS } from "@/shared/lib/permissions";

import { getDefaultRegionPuckData } from "../../lib/default-regions";
import type {
  SiteLayoutPreview,
  SiteLayoutPreviewRegion,
} from "../../lib/site-layout-preview";
import { resolveSmartLinksInPuckData } from "../resolve-link";

import { getLiveRegionByKey } from "./get-live-region-by-key";
import { getRegionWithVersions } from "./get-region-with-versions";

export interface GetSiteLayoutPreviewInput {
  /** Backoffice user opening the page editor; decides draft visibility. */
  userId: string;
}

/**
 * Load the Header and Footer documents the page editor draws around a Page.
 *
 * Per region:
 * - the current version when it differs from the live one and the user may
 *   read the Site layout (draft);
 * - otherwise the live version (live);
 * - the code default when the region has never been published (default), or
 *   when a live version has no document at all.
 *
 * Both documents are cloned and prepared for rendering: SmartLinks are
 * resolved and embedded forms are hydrated. The stored versions are never
 * mutated, so the draft the region editor saves later is unaffected.
 */
export async function getSiteLayoutPreview({
  userId,
}: GetSiteLayoutPreviewInput): Promise<SiteLayoutPreview> {
  const user = await getAuthorizedUser(userId);
  const canReadDraft = Boolean(
    user && hasPermission(user.permissionKeys, PERMISSIONS.SITE_LAYOUT_READ),
  );

  const [header, footer] = await Promise.all([
    resolvePreviewRegion("HEADER", canReadDraft),
    resolvePreviewRegion("FOOTER", canReadDraft),
  ]);

  return { header, footer };
}

async function resolvePreviewRegion(
  key: SiteRegionKey,
  canReadDraft: boolean,
): Promise<SiteLayoutPreviewRegion> {
  const [region, live] = await Promise.all([
    // The current version is only read when the user may see a draft, so a
    // user without `site_layout.read` never loads one at all.
    canReadDraft ? getRegionWithVersions(key) : Promise.resolve(null),
    // Entity links become real URLs only for rendering; the draft stays raw.
    getLiveRegionByKey(key, { resolveLinks: true }),
  ]);

  // A region that has never been published, or whose published document is
  // missing, shows the generic fallback.
  if (!live || !live.puckData) {
    return { data: getDefaultRegionPuckData(key), state: "default" };
  }

  const current = region?.currentVersion;

  if (!current || current.id === live.id || current.puckData == null) {
    return { data: live.puckData, state: "live" };
  }

  // `getRegionWithVersions` already cloned and hydrated the current document;
  // resolving the SmartLinks clones it again, so the stored draft is untouched.
  const data = await resolveSmartLinksInPuckData(current.puckData);

  return { data, state: "draft" };
}
