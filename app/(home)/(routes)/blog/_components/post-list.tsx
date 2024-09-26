import PostCard from "./post-card";
import { PostPagination } from "./post-pagination";
import Sidebar from "@/app/(home)/_components/sidebar";
import { PostWithImageCoverWithCategoryWithTags } from "@/lib/post";

interface PostListProps {
  posts: PostWithImageCoverWithCategoryWithTags[];
  currentPage: number;
  totalPages: number;
}

export const PostList = ({ posts, currentPage, totalPages }: PostListProps) => {
  return (
    <section className="mx-auto mb-12  grid max-w-6xl grid-cols-1 px-4 sm:grid-cols-2 xl:grid-cols-6 xl:gap-6">
      <div className="col-span-1 sm:col-span-2 xl:col-span-4 mb-10">
        {posts.map((post) => (
          <PostCard
            key={post.slug}
            id={post.id}
            title={post.title}
            description={post.description!}
            slug={post.slug}
            categoryTitle={post.category?.title!}
            categorySlug={post.category?.description!}
            imageCoverUrl={post.imageCover?.url || ""}
            imageCoverAlt={post.imageCover?.altText || ""}
            authorName={`${post.user?.firstName} ${post.user?.lastName}`}
            updatedAt={post.updatedAt}
          />
        ))}
        <PostPagination currentPage={currentPage} totalPages={totalPages} />
      </div>
      <div
        className="col-span-1 self-start sm:col-span-2 lg:block xl:col-span-2 xl:px-3"
        // ref={stickyRef}
      >
        <Sidebar />
      </div>
    </section>
  );
};
