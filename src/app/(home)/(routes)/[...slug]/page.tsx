import type { Metadata } from "next";

import { ContentStatus } from "@/generated/prisma";

import {
  getPublishedPageBySlug,
  getPublishedPagesBuilding,
} from "@/modules/pages/server/queries";
import { PuckRender } from "@/puck/render-config";

import {
  getPaginatedPostsByFilters,
  getPublishedPostsBuilding,
} from "@/modules/blog/posts/server/queries";

import { getSettings } from "@/data/settings";

import {
  getPageMetadataBySlug,
  getPostMetadataBySlug,
} from "@/app/(home)/_components/seo/content-metadata";
import { getHeadMetadata } from "@/app/(home)/_components/seo/head-metadata";

import { PostSlugView } from "@/modules/blog/posts";
import { BlogView } from "@/modules/blog/ui/views/blog-view";

export const revalidate = 86400;

export const dynamicParams = true;

export async function generateStaticParams() {
  const posts = await getPublishedPostsBuilding();
  const pages = await getPublishedPagesBuilding();

  const postPaths = posts.map((post) => ({ slug: post.slug.split("/") }));
  const pagePaths = pages.map((page) => ({ slug: page.slug.split("/") }));

  return [{ slug: [`blog`] }, ...postPaths, ...pagePaths];
}

export async function generateMetadata(
  props: PageProps<"/[...slug]">,
): Promise<Metadata | null> {
  const params = await props.params;
  const slugPath = params.slug.join("/");

  const { siteUrl } = await getSettings();

  if (slugPath === "blog") {
    const metadata = await getHeadMetadata();

    const { posts } = await getPaginatedPostsByFilters({
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
        canonical: `${siteUrl}/${slugPath}/`,
      },
    };
  }

  const pageMetadata = await getPageMetadataBySlug(slugPath);
  if (pageMetadata) {
    return pageMetadata;
  }

  return await getPostMetadataBySlug(slugPath);
}

const Page = async (props: PageProps<"/[...slug]">) => {
  const params = await props.params;
  const slugPath = params.slug.join("/");

  if (slugPath === "blog") return <BlogView />;

  const page = await getPublishedPageBySlug(slugPath);
  if (page && page.puckData) {
    return <PuckRender initialData={page.puckData} />;
  }

  return <PostSlugView slug={slugPath} />;
};

export default Page;
