import type { Metadata } from "next";
import { ContentStatus } from "@/generated/prisma";

import {
  getPaginatedPostsByFilters,
  getPublishedDraftPostsBuilding,
} from "@/modules/blog/posts/server/queries";

import {
  getDraftPageBySlug,
  getPublishedDraftPagesBuilding,
} from "@/modules/pages/server/queries";
import { PuckRender } from "@/puck/render-config";

import { PostDraftSlugView } from "@/modules/blog/posts";
import { BlogDraftView } from "@/modules/blog/ui/views/blog-draft-view";

import {
  getPageMetadataBySlug,
  getPostMetadataBySlug,
} from "@/app/(home)/_components/seo/content-metadata";

import { getHeadMetadata } from "@/app/(home)/_components/seo/head-metadata";

export const dynamic = "force-dynamic";

export const revalidate = 86400;

export const dynamicParams = true;

export async function generateStaticParams() {
  const posts = await getPublishedDraftPostsBuilding();
  const pages = await getPublishedDraftPagesBuilding();

  const postPaths = posts.map((post) => ({ slug: post.slug.split("/") }));
  const pagePaths = pages.map((page) => ({ slug: page.slug.split("/") }));

  const uniqueSlugs = [...new Set(postPaths), ...new Set(pagePaths)];

  return [{ slug: [`blog`] }, ...uniqueSlugs];
}

export async function generateMetadata(
  props: PageProps<"/draft/[...slug]">,
): Promise<Metadata | null> {
  const params = await props.params;
  const slugPath = params.slug.join("/");

  if (slugPath === "blog") {
    const metadata = await getHeadMetadata();

    const { posts } = await getPaginatedPostsByFilters({
      page: 1,
      where: {
        status: ContentStatus.DRAFT,
        isLatest: true,
      },
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

  const pageMetadata = await getPageMetadataBySlug(slugPath);
  if (pageMetadata) {
    return {
      ...pageMetadata,
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
    ...(await getPostMetadataBySlug(slugPath)),
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

const Page = async (props: PageProps<"/draft/[...slug]">) => {
  const params = await props.params;
  const slugPath = params.slug.join("/");

  if (slugPath === "blog") return <BlogDraftView />;

  const page = await getDraftPageBySlug(slugPath);
  if (page && page.puckData) return <PuckRender initialData={page.puckData} />;

  return <PostDraftSlugView slug={slugPath} />;
};

export default Page;
