import type { Metadata } from "next";

import { ContentStatus } from "@/generated/prisma";

import { getPaginatedPostsByFilters } from "@/modules/blog/posts/server/queries";
import { getPublishedCategoriesBuilding } from "@/modules/blog/categories/server/queries";
import { getPublishedTagsBuilding } from "@/modules/blog/tags/server/queries";

import { PostList } from "@/modules/blog/posts/ui/public/components/post-list";

import { db } from "@/shared/lib/db";

import { getSettings } from "@/data/settings";

import {
  getCategoryMetadataBySlug,
  getTagMetdataBySlug,
} from "@/app/(home)/_components/seo/content-metadata";
import { getHeadMetadata } from "@/app/(home)/_components/seo/head-metadata";
import { BlogCategoriesTags } from "@/modules/blog/ui/views/blog-categories-tags";

export const revalidate = 86400;

export const dynamicParams = true;

export async function generateStaticParams() {
  const totalPosts = await db.post.count({
    where: { status: ContentStatus.PUBLISHED, isLatest: true },
  });
  const pages = Math.ceil(totalPosts / 10);

  const blogs = Array.from({ length: pages }, (_, index) => ({
    slug: `blog/${index + 1}`,
  })).filter((b) => b.slug !== "blog/1");

  const categories = await getPublishedCategoriesBuilding();
  const tags = await getPublishedTagsBuilding();
  return [
    ...blogs,
    ...categories.map((category) => ({ slug: category.slug })),
    ...tags.map((tag) => ({ slug: tag.slug })),
  ];
}

export async function generateMetadata(
  props: PageProps<"/blog/[slug]">,
): Promise<Metadata | null> {
  const params = await props.params;
  const { slug } = params;

  const { siteUrl } = await getSettings();

  const categoryMetadata = await getCategoryMetadataBySlug(slug);
  if (categoryMetadata) {
    return categoryMetadata;
  }

  const tagMetadata = await getTagMetdataBySlug(slug);

  if (tagMetadata) {
    return tagMetadata;
  }

  const slugPage = typeof slug === "string" ? Number.parseInt(slug) : 1;

  const metadata = await getHeadMetadata();

  if (!isNaN(slugPage) && isFinite(slugPage) && slugPage > 0) {
    const { posts } = await getPaginatedPostsByFilters({
      page: slugPage,
      where: {
        status: ContentStatus.PUBLISHED,
        isLatest: true,
      },
    });

    if (posts.length > 0) {
      return {
        ...metadata,
        title: `News: ${posts[0].title}`,
        description: `Ultime notizie sulla sceneggiatura cinematografica. ${posts[0].title}`,
        alternates: {
          canonical: `${siteUrl}/blog/${slug}/`,
        },
      };
    }
  }

  return metadata;
}

const Page = async (props: PageProps<"/blog/[slug]">) => {
  const { slug } = await props.params;
  return <BlogCategoriesTags slug={slug} />;
};

export default Page;
