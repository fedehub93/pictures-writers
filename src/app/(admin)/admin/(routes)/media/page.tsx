import { db } from "@/lib/db";

import { requirePermission } from "@/shared/lib/auth-utils";
import { PERMISSIONS } from "@/shared/lib/permissions";

import {
  mediaLibrarySelect,
  type MediaLibraryEntry,
  type MediaLibraryView,
} from "@/modules/media/lib/media-library";
import { countMediaReferencesFor } from "@/modules/media/server/media-usage";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";
import { AssetsList } from "./_components/assets-list";

const PER_PAGE = 8;

const MediaPage = async (props: {
  searchParams?: Promise<{
    query?: string;
    s?: string;
    page?: string;
    view?: string;
  }>;
}) => {
  await requirePermission(PERMISSIONS.MEDIA_READ);

  const searchParams = await props.searchParams;

  const query = searchParams?.s || "";
  const page = Number(searchParams?.page) || 1;
  const view: MediaLibraryView =
    searchParams?.view === "archived" ? "archived" : "active";

  const skip = (page - 1) * PER_PAGE;
  const take = PER_PAGE;

  const where = {
    name: { contains: query, mode: "insensitive" as const },
    archivedAt: view === "archived" ? { not: null } : null,
  };

  const [assets, totalAssets] = await db.$transaction([
    db.media.findMany({
      where,
      select: mediaLibrarySelect,
      take,
      skip,
      orderBy: {
        createdAt: "desc",
      },
    }),
    db.media.count({ where }),
  ]);

  const usage = await countMediaReferencesFor(assets.map((asset) => asset.id));
  const items: MediaLibraryEntry[] = assets.map((asset) => ({
    ...asset,
    usageCount: usage.get(asset.id) ?? 0,
  }));

  const pagination = {
    page,
    perPage: PER_PAGE,
    totalRecords: totalAssets,
    totalPages: Math.ceil(totalAssets / PER_PAGE),
  };

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <ContentHeader label="Media assets" totalEntries={totalAssets} />
      <div className="flex flex-col gap-y-4">
        <AssetsList items={items} pagination={pagination} view={view} />
      </div>
    </div>
  );
};

export default MediaPage;
