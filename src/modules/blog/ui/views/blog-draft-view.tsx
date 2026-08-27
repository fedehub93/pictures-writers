import { ContentStatus } from "@/generated/prisma";
import { getPaginatedPostsByFilters } from "../../posts/server/queries";
import { PostList } from "../../posts/ui/public/components/post-list";

export const BlogDraftView = async () => {
  const { posts, totalPages, currentPage } = await getPaginatedPostsByFilters({
    page: 1,
    where: {
      status: ContentStatus.DRAFT,
      isLatest: true,
    },
  });
  return (
    <section className="bg-background px-4 py-10 lg:px-6">
      <div>
        <h1 className="mb-4 text-center text-3xl font-bold">News</h1>
        <p className="mx-auto mb-12 max-w-lg text-center">
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
