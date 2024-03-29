import { redirectToSignIn } from "@clerk/nextjs";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

import { ContentHeader } from "@/components/content/content-header";

import { DataTable } from "./(routes)/_components/data-table";
import { columns } from "./(routes)/_components/columns";

const PostsPage = async () => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return redirectToSignIn();
  }

  const posts = await db.post.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <ContentHeader label="Posts" totalEntries={posts.length} />
      <DataTable columns={columns} data={posts} />
    </div>
  );
};

export default PostsPage;
