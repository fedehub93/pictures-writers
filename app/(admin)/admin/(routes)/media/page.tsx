import { authAdmin } from "@/lib/auth-service";
import { redirectToSignIn } from "@clerk/nextjs";

import { db } from "@/lib/db";
import { MediaActions } from "./_components/actions";
import { AssetsList } from "./_components/assets-list";
import { ContentHeader } from "@/components/content/content-header";

const PER_PAGE = 8;

const MediaPage = async ({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    title?: string;
    page?: string;
  };
}) => {
  const user = await authAdmin();
  if (!user) {
    return redirectToSignIn();
  }

  const query = searchParams?.title || "";
  const page = Number(searchParams?.page) || 1;

  const skip = (page - 1) * PER_PAGE;
  const take = PER_PAGE;

  const [assets, totalAssets] = await db.$transaction([
    db.media.findMany({
      where: {
        name: { contains: query, mode: "insensitive" },
      },
      take,
      skip,
      orderBy: {
        createdAt: "desc",
      },
    }),
    db.media.count(),
  ]);

  const pagination = {
    page,
    perPage: PER_PAGE,
    totalRecords: totalAssets,
    totalPages: Math.ceil(totalAssets / PER_PAGE),
  };

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <ContentHeader label="Media assets" totalEntries={assets.length} />
      <div className="flex flex-col gap-y-4">
        <AssetsList items={assets} pagination={pagination} />
      </div>
    </div>
  );
};

export default MediaPage;
