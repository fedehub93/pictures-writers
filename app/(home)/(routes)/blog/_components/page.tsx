import { Metadata } from "next";
import { getPublishedPosts } from "@/lib/post";

import { PostList } from "./post-list";
import { getHeadMetadata } from "../../../_components/seo/head-metadata";

type Props = {
  searchParams: { page: string };
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata | null> {
  const metadata = await getHeadMetadata();

  const currentPage = Number(searchParams?.page) || 1;

  const { posts } = await getPublishedPosts({
    page: currentPage,
  });

  return {
    ...metadata,
    title: `News: ${posts[0].title}`,
    description: `Ultime notizie sulla sceneggiatura cinematografica. ${posts[0].title}`,
  };
}

const Page = async () => {
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
};

export default Page;
