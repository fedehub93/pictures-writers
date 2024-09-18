import { getPublishedPostBySlug } from "@/lib/post";
import { getPublishedCategoryBySlug } from "@/lib/category";
import { PostTemplate } from "./_components/post-template";

export const Page = async ({ params }: { params: { slug: string } }) => {
  const post = await getPublishedPostBySlug(params.slug);

  if (post) {
    return <PostTemplate post={post} />;
  }

  const category = await getPublishedCategoryBySlug(params.slug);
  if (!category) {
    return <div>Page not found</div>;
  }

  return <div>Page not found</div>;
};

export default Page;
