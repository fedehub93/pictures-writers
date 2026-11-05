import { notFound } from "next/navigation";

import { requireAdminAuth } from "@/shared/lib/auth-utils";

import { SiteRegionEditorView } from "@/modules/site-regions/ui/views/site-region-editor-view";
import { createSiteRegion } from "@/modules/site-regions/server/create-site-region";
import { getRegionWithVersions } from "@/modules/site-regions/server/queries";
import { siteRegionKeySchema } from "@/modules/site-regions/schemas";

interface SiteRegionEditorPageProps {
  params: Promise<{ key: string }>;
}

const SiteRegionEditorPage = async ({ params }: SiteRegionEditorPageProps) => {
  const session = await requireAdminAuth();
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
    />
  );
};

export default SiteRegionEditorPage;
