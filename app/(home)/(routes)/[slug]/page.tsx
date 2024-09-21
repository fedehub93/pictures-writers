import type { Metadata } from "next";

import { getPublishedPostBySlug } from "@/lib/post";
import { getPublishedCategoryBySlug } from "@/lib/category";
import { PostTemplate } from "@/app/(home)/(routes)/[slug]/_components/post-template";
import { getPostMetadataBySlug } from "@/app/(home)/_components/seo/content-metadata";
import { BlogPostingJsonLd } from "@/app/(home)/_components/seo/json-ld/blog-posting";

type Params = {
  slug: string;
};

type Props = {
  params: Params;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;

  return await getPostMetadataBySlug(slug);
}

export const Page = async ({ params }: { params: { slug: string } }) => {
  const post = await getPublishedPostBySlug(params.slug);

  if (post) {
    console.log("POST", post);
    const bodyImages =
      post.bodyData
        .filter(
          (image) => image.type === "image" && image.url && image.url !== ""
        )
        .map((image) => image.url || "") || [];

    const bodyVideos =
      post.bodyData
        .filter(
          (video) => video.type === "video" && video.url && video.url !== ""
        )
        .map((video) => video.url || "") || [];

    return (
      <>
        <BlogPostingJsonLd
          title={post.seo?.title}
          description={post.seo?.description || ""}
          images={bodyImages}
          videos={bodyVideos}
          authorName={`${post.user?.firstName} ${post.user?.lastName}`}
          datePublished={post.firstPublishedAt.toISOString()}
          dateModified={post.publishedAt.toISOString()}
          url={`https://pictureswriters.com/${post.slug}`}
        />
        <PostTemplate post={post} />
      </>
    );
  }

  const category = await getPublishedCategoryBySlug(params.slug);
  if (!category) {
    return <div>Page not found</div>;
  }

  return <div>Page not found</div>;
};

export default Page;
