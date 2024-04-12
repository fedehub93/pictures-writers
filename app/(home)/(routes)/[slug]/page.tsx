import { db } from "@/lib/db";

export const Page = async ({ params }: { params: { slug: string } }) => {
  const post = await db.post.findUnique({
    where: {
      slug: params.slug,
      isPublished: true,
    },
    include: {
      versions: {
        take: 1,
        orderBy: {
          publishedAt: "desc",
        },
      },
    },
  });

  if (!post) {
    return <div>Page not found</div>;
  }

  return <div>{post.versions[0].title}</div>;
};

export default Page;
