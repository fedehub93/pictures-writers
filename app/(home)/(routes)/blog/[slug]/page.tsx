import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ContentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import {
  getPublishedPosts,
  getPublishedPostsByCategoryRootId,
  getPublishedPostsByTagRootId,
} from "@/lib/post";
import {
  getPublishedCategoriesBuilding,
  getPublishedCategoryBySlug,
} from "@/lib/category";
import { getPublishedTagBySlug, getPublishedTagsBuilding } from "@/lib/tag";
import {
  getCategoryMetadataBySlug,
  getTagMetdataBySlug,
} from "@/app/(home)/_components/seo/content-metadata";
import { getHeadMetadata } from "@/app/(home)/_components/seo/head-metadata";

import { PostListGrid } from "../_components/post-list-grid";
import { PostList } from "../_components/post-list";

type Params = {
  slug: string;
};

type Props = {
  params: Params;
};

export const revalidate = 3600 * 24;

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

export async function generateMetadata({
  params,
}: Props): Promise<Metadata | null> {
  const { slug } = params;

  const categoryMetadata = await getCategoryMetadataBySlug(slug);
  if (categoryMetadata) {
    return categoryMetadata;
  }

  const tagMetadata = await getTagMetdataBySlug(slug);

  if (tagMetadata) {
    return tagMetadata;
  }

  const slugPage =
    typeof params.slug === "string" ? Number.parseInt(params.slug) : 1;

  const metadata = await getHeadMetadata();

  if (!isNaN(slugPage) && isFinite(slugPage) && slugPage > 0) {
    const { posts } = await getPublishedPosts({
      page: slugPage,
    });

    if (posts.length > 0) {
      return {
        ...metadata,
        title: `News: ${posts[0].title}`,
        description: `Ultime notizie sulla sceneggiatura cinematografica. ${posts[0].title}`,
      };
    }
  }

  return metadata;
}

const Page = async ({ params }: { params: { slug: string } }) => {
  let result: any = null;
  let entity: { title: string; description: string | null } | null = null;

  const slugPage =
    typeof params.slug === "string" ? Number.parseInt(params.slug) : 1;

  if (!isNaN(slugPage) && isFinite(slugPage) && slugPage > 0) {
    result = await getPublishedPosts({
      page: slugPage,
    });
    entity = {
      title: "News",
      description:
        "Rimani sempre aggiornato con le ultime news del nostro blog.",
    };
  }

  if (result && result.posts.length > 0 && entity) {
    return (
      <section className="bg-violet-100/40 px-4 py-10 lg:px-6">
        <div>
          <h1 className="mb-4 text-center text-3xl font-bold">
            {entity.title}
          </h1>
          <p className="mx-auto mb-12 max-w-lg text-center text-gray-400">
            {entity.description}
          </p>
        </div>
        <PostList
          posts={result.posts}
          totalPages={result.totalPages}
          currentPage={result.currentPage}
        />
      </section>
    );
  }

  if (!result) {
    const category = await getPublishedCategoryBySlug(params.slug);
    if (category && category.rootId) {
      result = await getPublishedPostsByCategoryRootId({
        categoryRootId: category.rootId,
      });

      entity = { title: category.title, description: category.description };
    }
  }

  if (!result) {
    const tag = await getPublishedTagBySlug(params.slug);
    if (tag && tag.rootId) {
      result = await getPublishedPostsByTagRootId({
        tagRootId: tag.rootId,
      });
      entity = { title: tag.title, description: tag.description };
    }
  }

  if (!result || result.posts.length === 0 || !entity) {
    return redirect("/blog");
  }

  return (
    <section className="bg-violet-100/40 px-4 py-10 lg:px-6">
      <div>
        <h1 className="mb-4 text-center text-3xl font-bold">{entity.title}</h1>
        <p className="mx-auto mb-12 max-w-lg text-center text-gray-400">
          {entity.description}
        </p>
      </div>
      <PostListGrid posts={result.posts} />
    </section>
  );
};

export default Page;
