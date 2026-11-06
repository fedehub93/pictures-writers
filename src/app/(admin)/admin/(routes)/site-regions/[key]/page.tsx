import { notFound } from "next/navigation";

import { getSettings } from "@/data/settings";
import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

import { SiteRegionEditorView } from "@/modules/site-regions/ui/views/site-region-editor-view";
import { createSiteRegion } from "@/modules/site-regions/server/create-site-region";
import { getRegionWithVersions } from "@/modules/site-regions/server/queries";
import { siteRegionKeySchema } from "@/modules/site-regions/schemas";

interface SiteRegionEditorPageProps {
  params: Promise<{ key: string }>;
}

const SiteRegionEditorPage = async ({ params }: SiteRegionEditorPageProps) => {
  const session = await requirePermission(PERMISSIONS.SITE_LAYOUT_UPDATE);
  const { key: rawKey } = await params;

  const key = siteRegionKeySchema.safeParse(rawKey.toUpperCase());
  if (!key.success) {
    notFound();
  }

  let region = await getRegionWithVersions(key.data);

  if (!region) {
    await createSiteRegion({ key: key.data, userId: session.id });
    region = await getRegionWithVersions(key.data);
  }

  if (!region?.currentVersion) {
    notFound();
  }

  const settings = await getSettings();

  return (
    <SiteRegionEditorView
      region={{
        key: region.key,
        rootId: region.id,
        version: {
          id: region.currentVersion.id,
          version: region.currentVersion.version,
          status: region.currentVersion.status,
          puckData: region.currentVersion.puckData,
        },
      }}
      metadata={{
        siteName: settings.siteName ?? undefined,
        logoUrl: settings.logoUrl ?? undefined,
      }}
    />
  );
};

export default SiteRegionEditorPage;
