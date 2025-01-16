import PostCard from "./post-card";
import { PostWithImageCoverWithCategoryWithTags } from "@/lib/post";

interface PostListGridProps {
  posts: PostWithImageCoverWithCategoryWithTags[];
}

export const PostListGrid = ({ posts }: PostListGridProps) => {
  return (
    <section className="mx-auto mb-20 grid  w-11/12 max-w-6xl grid-cols-1 px-4 sm:grid-cols-2 xl:grid-cols-6 xl:gap-6">
      {posts.map((post) => (
        <div key={post.slug} className="col-span-1 mb-10 xl:col-span-3">
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
            authors={post.postAuthors.map((v) => v.user)}
            updatedAt={post.updatedAt}
          />
        </div>
      ))}
      {/* <div className="col-span-1 self-start sm:col-span-2 lg:block xl:col-span-2 xl:px-3">
        <Sidebar />
      </div> */}
    </section>
  );
};
