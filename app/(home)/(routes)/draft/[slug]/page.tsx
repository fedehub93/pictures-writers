import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WidgetSection, WidgetType } from "@prisma/client";

import { db } from "@/lib/db";
import {
  getPublishedDraftPostBySlug,
  getPublishedDraftPosts,
  getPublishedDraftPostsBuilding,
} from "@/lib/post";
import { getPublishedProductByRootId } from "@/data/product";
import { getSettings } from "@/data/settings";
import { isWidgetProductPopMetadata } from "@/type-guards";
import { getPostMetadataBySlug } from "@/app/(home)/_components/seo/content-metadata";
import { BlogPostingJsonLd } from "@/app/(home)/_components/seo/json-ld/blog-posting";
import { getHeadMetadata } from "@/app/(home)/_components/seo/head-metadata";
import { PostTemplate } from "@/app/(home)/(routes)/[slug]/_components/post-template";
import { PostList } from "@/app/(home)/(routes)/blog/_components/post-list";

import { WidgetProductPop } from "@/components/widget/product-pop";

export const dynamic = "force-dynamic";

export const revalidate = 86400;

export const dynamicParams = true;

export async function generateStaticParams() {
  const posts = await getPublishedDraftPostsBuilding();

  return [{ slug: `blog` }, ...posts.map((post) => ({ slug: post.slug }))];
}

export async function generateMetadata(
  props: PageProps<"/draft/[slug]">
): Promise<Metadata | null> {
  const params = await props.params;
  const { slug } = params;

  if (slug === "blog") {
    const metadata = await getHeadMetadata();

    const { posts } = await getPublishedDraftPosts({
      page: 1,
    });

    return {
      ...metadata,
      title: `News: ${posts[0].title}`,
      description: `Ultime notizie sulla sceneggiatura cinematografica. ${posts[0].title}`,
      robots: {
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
        },
      },
    };
  }

  return {
    ...(await getPostMetadataBySlug(slug)),
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

const Page = async (props: PageProps<"/draft/[slug]">) => {
  const { slug } = await props.params;
  const { siteUrl } = await getSettings();

  if (slug === "blog") {
    const { posts, totalPages, currentPage } = await getPublishedDraftPosts({
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

  const post = await getPublishedDraftPostBySlug(slug);

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
    <section key={post.slug} className="bg-violet-100/40 py-10">
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
