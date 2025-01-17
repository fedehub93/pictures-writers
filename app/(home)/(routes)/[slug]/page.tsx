import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getPublishedPostBySlug,
  getPublishedPosts,
  getPublishedPostsBuilding,
} from "@/lib/post";
import { getPostMetadataBySlug } from "@/app/(home)/_components/seo/content-metadata";
import { BlogPostingJsonLd } from "@/app/(home)/_components/seo/json-ld/blog-posting";
import { getHeadMetadata } from "@/app/(home)/_components/seo/head-metadata";
import { FreeEbookModal } from "@/app/(home)/_components/free-ebook-modal";
import { PostTemplate } from "@/app/(home)/(routes)/[slug]/_components/post-template";
import { PostList } from "../blog/_components/post-list";
import { getSettings } from "@/data/settings";

type Params = {
  slug: string;
};

type Props = {
  params: Params;
};

export const revalidate = 3600 * 24;

export const dynamicParams = true;

export async function generateStaticParams() {
  const posts = await getPublishedPostsBuilding();

  return [{ slug: `blog` }, ...posts.map((post) => ({ slug: post.slug }))];
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata | null> {
  const { slug } = params;

  if (slug === "blog") {
    const metadata = await getHeadMetadata();

    const { posts } = await getPublishedPosts({
      page: 1,
    });

    return {
      ...metadata,
      title: `News: ${posts[0].title}`,
      description: `Ultime notizie sulla sceneggiatura cinematografica. ${posts[0].title}`,
    };
  }

  return await getPostMetadataBySlug(slug);
}

const Page = async ({ params }: { params: { slug: string } }) => {
  const { siteUrl } = await getSettings();

  if (params.slug === "blog") {
    const { posts, totalPages, currentPage } = await getPublishedPosts({
      page: 1,
    });
    return (
      <section className="bg-violet-100/40 px-4 py-10 lg:px-6">
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
  }

  const post = await getPublishedPostBySlug(params.slug);

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
    <section key={post.slug} className="bg-violet-100/40 py-10">
      <BlogPostingJsonLd
        title={post.seo?.title}
        description={post.seo?.description || ""}
        imageCover={post.imageCover}
        images={bodyImages}
        videos={bodyVideos}
        authorName={`${post.user?.firstName} ${post.user?.lastName}`}
        datePublished={post.firstPublishedAt.toISOString()}
        dateModified={post.publishedAt.toISOString()}
        url={`${siteUrl}/${post.slug}`}
      />
      <PostTemplate post={post} />
      {/* <FreeEbookModal /> */}
    </section>
  );
};

export default Page;
