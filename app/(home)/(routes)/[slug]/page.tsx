import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ContentStatus,
  EditorType,
  WidgetSection,
  WidgetType,
} from "@/prisma/generated/client";

import { db } from "@/lib/db";

import { isJSONContent, isWidgetProductPopMetadata } from "@/type-guards";

import {
  getPostsPaginatedByFilters,
  getPublishedPostBySlug,
} from "@/data/post";
import { getPublishedProductByRootId } from "@/data/product";
import { getSettings } from "@/data/settings";

import { getPublishedPostsBuilding } from "@/lib/post";

import { getPostMetadataBySlug } from "@/app/(home)/_components/seo/content-metadata";
import { BlogPostingJsonLd } from "@/app/(home)/_components/seo/json-ld/blog-posting";
import { getHeadMetadata } from "@/app/(home)/_components/seo/head-metadata";
import { PostTemplate } from "@/app/(home)/(routes)/[slug]/_components/post-template";
import { PostList } from "@/app/(home)/(routes)/blog/_components/post-list";

import { WidgetProductPop } from "@/components/widget/product-pop";

export const revalidate = 86400;

export const dynamicParams = true;

export async function generateStaticParams() {
  const posts = await getPublishedPostsBuilding();

  return [{ slug: `blog` }, ...posts.map((post) => ({ slug: post.slug }))];
}

export async function generateMetadata(
  props: PageProps<"/[slug]">
): Promise<Metadata | null> {
  const params = await props.params;
  const { slug } = params;

  const { siteUrl } = await getSettings();

  if (slug === "blog") {
    const metadata = await getHeadMetadata();

    const { posts } = await getPostsPaginatedByFilters({
      page: 1,
      where: {
        status: ContentStatus.PUBLISHED,
        isLatest: true,
      },
    });

    return {
      ...metadata,
      title: `News: ${posts[0].title}`,
      description: `Ultime notizie sulla sceneggiatura cinematografica. ${posts[0].title}`,
      alternates: {
        canonical: `${siteUrl}/${slug}/`,
      },
    };
  }

  return await getPostMetadataBySlug(slug);
}

const Page = async (props: PageProps<"/[slug]">) => {
  const { slug } = await props.params;
  const { siteUrl } = await getSettings();

  if (slug === "blog") {
    const { posts, totalPages, currentPage } = await getPostsPaginatedByFilters(
      {
        page: 1,
        where: {
          status: ContentStatus.PUBLISHED,
          isLatest: true,
        },
      }
    );
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
  }

  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return notFound();
  }

  let bodyImages: string[] = [];
  let bodyVideos: string[] = [];

  if (post.editorType === EditorType.SLATE) {
    bodyImages =
      post.bodyData
        .filter(
          (image) => image.type === "image" && image.url && image.url !== ""
        )
        .map((image) => image.url || "") || [];

    bodyVideos =
      post.bodyData
        .filter(
          (video) => video.type === "video" && video.url && video.url !== ""
        )
        .map((video) => video.url || "") || [];
  }

  if (
    post.editorType === EditorType.TIPTAP &&
    isJSONContent(post.tiptapBodyData)
  ) {
    bodyImages =
      post.tiptapBodyData.content
        ?.filter((image) => image.type === "image" && image.attrs?.src !== "")
        .map((image) => image.attrs?.src || "") || [];

    bodyVideos =
      post.tiptapBodyData.content
        ?.filter((video) => video.type === "youtube" && video.attrs?.src !== "")
        .map((video) => video.attrs?.src || "") || [];
  }

  const widgetPopup = await db.widget.findFirst({
    where: {
      section: WidgetSection.MODAL_POPUP,
      isEnabled: true,
      type: { in: [WidgetType.PRODUCT_POP, WidgetType.NEWSLETTER_POP] },
    },
  });

  const isValidWidgetPopup =
    widgetPopup &&
    widgetPopup.metadata &&
    isWidgetProductPopMetadata(widgetPopup.metadata) &&
    widgetPopup.metadata.productRootId;

  let product = null;

  if (isValidWidgetPopup) {
    product = await getPublishedProductByRootId(
      widgetPopup.metadata.productRootId
    );
  }

  return (
    <section key={post.slug} className="bg-background py-10">
      <BlogPostingJsonLd
        title={post.seo?.title}
        description={post.seo?.description || ""}
        imageCover={post.imageCover}
        images={bodyImages}
        videos={bodyVideos}
        authors={post.postAuthors.map((a) => a.user)}
        datePublished={post.firstPublishedAt.toISOString()}
        dateModified={post.publishedAt.toISOString()}
        url={`${siteUrl}/${post.slug}`}
      />
      <PostTemplate post={post} />
      {isValidWidgetPopup && product && (
        <WidgetProductPop
          rootId={product.rootId!}
          title={product.title}
          slug={product.slug}
          imageCoverUrl={product.imageCover?.url!}
          label={widgetPopup.metadata.label}
          actionType={widgetPopup.metadata.actionType}
          autoOpenDelay={widgetPopup.metadata.autoOpenDelay}
        />
      )}
    </section>
  );
};

export default Page;
