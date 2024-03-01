import { authAdmin } from "@/lib/auth-service";
import { redirectToSignIn } from "@clerk/nextjs";

import { db } from "@/lib/db";
import { MediaActions } from "./_components/actions";
import { AssetsList } from "./_components/assets-list";

const PER_PAGE = 8;

const MediaPage = async ({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
  };
}) => {
  const user = await authAdmin();
  if (!user) {
    return redirectToSignIn();
  }

  const query = searchParams?.query || "";
  const page = Number(searchParams?.page) || 1;

  const skip = (page - 1) * PER_PAGE;
  const take = PER_PAGE;

  const [assets, totalAssets] = await db.$transaction([
    db.media.findMany({
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
    <div className="h-full w-full flex flex-col gap-y-2 p-8">
      <div className="w-full h-12 flex items-center justify-between gap-x-2">
        <div className="flex flex-col flex-1">
          <h1 className="text-2xl">Media assets</h1>
        </div>
        <MediaActions />
      </div>
      <div className="flex flex-col gap-y-4">
        <AssetsList items={assets} pagination={pagination} />
      </div>
    </div>
  );
};

export default MediaPage;
