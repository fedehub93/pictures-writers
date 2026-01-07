import { Metadata } from "next";

import { ContentStatus } from "@/prisma/generated/client";
import { PostList } from "./post-list";
import { getHeadMetadata } from "../../../_components/seo/head-metadata";
import { getPostsPaginatedByFilters } from "@/data/post";

type Props = {
  searchParams: Promise<{ page: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata | null> {
  const searchParams = await props.searchParams;
  const metadata = await getHeadMetadata();

  const currentPage = Number(searchParams?.page) || 1;

  const { posts } = await getPostsPaginatedByFilters({
    page: currentPage,
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
  });

  return {
    ...metadata,
    title: `News: ${posts[0].title}`,
    description: `Ultime notizie sulla sceneggiatura cinematografica. ${posts[0].title}`,
  };
}

const Page = async () => {
  const { posts, totalPages, currentPage } = await getPostsPaginatedByFilters({
    page: 1,
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
  });

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
};

export default Page;
