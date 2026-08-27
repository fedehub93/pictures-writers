import { redirect } from "next/navigation";

import { ContentStatus } from "@/generated/prisma";

import {
  getPaginatedPostsByFilters,
  getPostsByFilters,
} from "../../posts/server/queries";
import { getPublishedCategoryBySlug } from "../../categories/server/queries";
import { getPublishedTagBySlug } from "../../tags/server/queries";

import { PostListGrid } from "../../posts/ui/public/components/post-list-grid";
import { PostList } from "../../posts/ui/public/components/post-list";

interface BlogCategoriesTagsProps {
  slug: string;
}

export const BlogCategoriesTags = async ({ slug }: BlogCategoriesTagsProps) => {
  let result: any = null;
  let entity: { title: string; description: string | null } | null = null;

  const slugPage = typeof slug === "string" ? Number.parseInt(slug) : 1;

  if (!isNaN(slugPage) && isFinite(slugPage) && slugPage > 0) {
    result = await getPaginatedPostsByFilters({
      page: slugPage,
      where: { status: ContentStatus.PUBLISHED, isLatest: true },
    });
    entity = {
      title: "News",
      description:
        "Rimani sempre aggiornato con le ultime news del nostro blog.",
    };
  }

  if (result && result.posts.length > 0 && entity) {
    return (
      <section className="px-4 py-10 lg:px-6">
        <div>
          <h1 className="mb-4 text-center text-3xl font-bold">
            {entity.title}
          </h1>
          <p className="mx-auto mb-12 max-w-lg text-center">
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
    const category = await getPublishedCategoryBySlug(slug);
    if (category && category.rootId) {
      result = await getPostsByFilters({
        where: {
          status: ContentStatus.PUBLISHED,
          isLatest: true,
          postCategories: {
            some: {
              category: {
                rootId: { equals: category.rootId },
              },
            },
          },
        },
      });

      entity = { title: category.title, description: category.description };
    }
  }

  if (!result) {
    const tag = await getPublishedTagBySlug(slug);
    if (tag && tag.rootId) {
      result = await getPostsByFilters({
        where: {
          status: ContentStatus.PUBLISHED,
          isLatest: true,
          tags: {
            some: {
              rootId: { equals: tag.rootId },
            },
          },
        },
      });
      entity = { title: tag.title, description: tag.description };
    }
  }

  if (!result || result.posts.length === 0 || !entity) {
    return redirect("/blog");
  }
  return (
    <section className="bg-background px-4 py-10 lg:px-6">
      <div>
        <h1 className="mb-4 text-center text-3xl font-bold">{entity.title}</h1>
        <p className="mx-auto mb-12 max-w-lg text-center">
          {entity.description}
        </p>
      </div>
      <PostListGrid posts={result.posts} />
    </section>
  );
};
