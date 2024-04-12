import { db } from "@/lib/db";
import { PostList } from "./_components/post-list";
import { getPublishedPosts } from "@/lib/post";

const POST_PER_PAGE = 10;

export const BlogPage = async ({
  searchParams,
}: {
  searchParams?: {
    page: string;
  };
}) => {
  const currentPage = Number(searchParams?.page) || 1;

  const { posts, totalPages } = await getPublishedPosts({ page: currentPage });

  return (
    <section className="bg-indigo-100/40 px-4 py-10 lg:px-6">
      <div>
        <h1 className="mb-4 text-center text-3xl font-bold">News</h1>
        <p className="mx-auto mb-12 max-w-lg text-center text-gray-400">
          Rimani sempre aggiornato con le ultime news del nostro blog.
        </p>
      </div>
      <PostList
        posts={posts}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </section>
  );
};

export default BlogPage;
