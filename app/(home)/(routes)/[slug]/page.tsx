import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getPublishedPostBySlug,
  getPublishedPostsBuilding,
  PostWithImageCoverWithCategoryWithTagsWithSeo,
} from "@/lib/post";
import { PostTemplate } from "@/app/(home)/(routes)/[slug]/_components/post-template";
import { getPostMetadataBySlug } from "@/app/(home)/_components/seo/content-metadata";
import { BlogPostingJsonLd } from "@/app/(home)/_components/seo/json-ld/blog-posting";

type Params = {
  slug: string;
};

type Props = {
  params: Params;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata | null> {
  const { slug } = params;

  return await getPostMetadataBySlug(slug);
}

export async function generateStaticParams() {
  const posts = await getPublishedPostsBuilding();

  return posts.map((post) => ({ slug: post.slug }));
}

async function getPost(params: { slug: string }) {
  const publishedPost = await getPublishedPostBySlug(params.slug);

  return publishedPost;
}

const Page = async ({ params }: { params: { slug: string } }) => {
  const post = await getPost(params);

  if (!post) {
    return notFound();
  }

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
};

export default Page;
