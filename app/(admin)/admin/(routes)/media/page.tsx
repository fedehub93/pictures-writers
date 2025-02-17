import { authAdmin } from "@/lib/auth-service";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { ContentHeader } from "@/app/(admin)/_components/content/content-header";
import { AssetsList } from "./_components/assets-list";

const PER_PAGE = 8;

const MediaPage = async (
  props: {
    searchParams?: Promise<{
      query?: string;
      s?: string;
      page?: string;
    }>;
  }
) => {
  const searchParams = await props.searchParams;
  const user = await authAdmin();
  if (!user) {
    return (await auth()).redirectToSignIn();
  }

  const query = searchParams?.s || "";
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
      <ContentHeader label="Media assets" totalEntries={totalAssets} />
      <div className="flex flex-col gap-y-4">
        <AssetsList items={assets} pagination={pagination} />
      </div>
    </div>
  );
};

export default MediaPage;
