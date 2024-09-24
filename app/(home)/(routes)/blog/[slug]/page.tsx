import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  getPublishedPostsByCategoryRootId,
  getPublishedPostsByTagRootId,
} from "@/lib/post";
import { getPublishedCategoryBySlug } from "@/lib/category";
import { getCategoryMetadataBySlug } from "@/app/(home)/_components/seo/content-metadata";

import { PostList } from "../_components/post-list";
import { getPublishedTagBySlug } from "@/lib/tag";

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

  return await getCategoryMetadataBySlug(slug);
}

export const Page = async ({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: {
    page: string;
  };
}) => {
  const currentPage = Number(searchParams?.page) || 1;
  const category = await getPublishedCategoryBySlug(params.slug);

  let result: any = null;
  let entity: { title: string; description: string | null } | null = null;

  if (category && category.rootId) {
    result = await getPublishedPostsByCategoryRootId({
      categoryRootId: category.rootId,
      page: currentPage,
    });

    entity = { title: category.title, description: category.description };
  }

  if (!result) {
    const tag = await getPublishedTagBySlug(params.slug);
    if (tag && tag.rootId) {
      result = await getPublishedPostsByTagRootId({
        tagRootId: tag.rootId,
        page: currentPage,
      });
      entity = { title: tag.title, description: tag.description };
    }
  }

  if (!result || result.posts.length === 0 || !entity) {
    return redirect("/blog");
  }

  return (
    <section className="bg-indigo-100/40 px-4 py-10 lg:px-6">
      <div>
        <h1 className="mb-4 text-center text-3xl font-bold">{entity.title}</h1>
        <p className="mx-auto mb-12 max-w-lg text-center text-gray-400">
          {entity.description}
        </p>
      </div>
      <PostList
        posts={result.posts}
        currentPage={result.currentPage}
        totalPages={result.totalPages}
      />
    </section>
  );
};

export default Page;
