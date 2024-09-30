import { Metadata } from "next";
import { getPublishedPosts } from "@/lib/post";

import { PostList } from "./_components/post-list";
import { getHeadMetadata } from "../../_components/seo/head-metadata";

type Props = {
  searchParams: { page: string; s: string };
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata | null> {
  const metadata = await getHeadMetadata();

  const currentPage = Number(searchParams?.page) || 1;
  const s = searchParams?.s || "";

  const { posts } = await getPublishedPosts({
    page: currentPage,
    s,
  });

  return {
    ...metadata,
    title: `News: ${posts[0].title}`,
    description: `Ultime notizie sulla sceneggiatura cinematografica. ${posts[0].title}`,
  };
}

const BlogPage = async ({
  searchParams,
}: {
  searchParams?: {
    page: string;
    s: string;
  };
}) => {
  const currentPage = Number(searchParams?.page) || 1;
  const s = searchParams?.s || "";

  const { posts, totalPages } = await getPublishedPosts({
    page: currentPage,
    s,
  });

  return (
    <section className="bg-indigo-100/40 px-4 py-10 lg:px-6">
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

export default BlogPage;
