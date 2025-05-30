import { auth } from "@clerk/nextjs/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";

import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";

const PostsPage = async () => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return (await auth()).redirectToSignIn();
  }

  const posts = await db.post.findMany({
    select: {
      id: true,
      rootId: true,
      title: true,
      slug: true,
      status: true,
      publishedAt: true,
      firstPublishedAt: true,
      imageCover: {
        select: {
          url: true,
          altText: true,
        },
      },
      postAuthors: {
        select: {
          user: {
            select: {
              email: true,
              imageUrl: true,
            },
          },
        },
        orderBy: {
          sort: "asc",
        },
      },
    },
    orderBy: {
      publishedAt: "desc",
    },
    distinct: ["rootId"],
  });


  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <ContentHeader label="Posts" totalEntries={posts.length} />
      <DataTable columns={columns} data={posts} />
    </div>
  );
};

export default PostsPage;
