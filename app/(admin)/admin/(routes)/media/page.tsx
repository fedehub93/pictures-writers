import { authAdmin } from "@/lib/auth-service";
import { redirectToSignIn } from "@clerk/nextjs";

import { db } from "@/lib/db";
import { MediaActions } from "./_components/actions";
import { AssetsList } from "./_components/assets-list";

const MediaPage = async () => {
  const user = await authAdmin();
  if (!user) {
    return redirectToSignIn();
  }

  const assets = await db.media.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="h-full w-full flex flex-col gap-y-8 p-8">
      <div className="w-full h-12 flex items-center justify-between gap-x-2">
        <div className="flex flex-col flex-1">
          <h1 className="text-2xl">Media assets</h1>
        </div>
        <MediaActions />
      </div>
      <div className="flex flex-col gap-y-4">
        <AssetsList items={assets} />
      </div>
    </div>
  );
};

export default MediaPage;
