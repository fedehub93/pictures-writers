import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { getLatestPublishedPosts } from "@/lib/post";

export const SidebarLatestNews = async () => {
  const latestNews = await getLatestPublishedPosts();

  return (
    <div className="w-full bg-white px-6 py-8 shadow-md flex flex-col gap-y-2">
      <h3 className="mb-4 text-sm font-extrabold uppercase">Post recenti</h3>

      <div className="flex flex-col">
        {latestNews.map((post) => {
          return (
            <Link
              key={post.title}
              href={`/${post.slug}`}
              className="flex items-center md:items-start text-gray-600 md:max-w-xl 2xl:flex-col group mb-2"
            >
              {post.imageCover ? (
                <div className="aspect-video relative w-full hidden 2xl:block">
                  <Image
                    src={post.imageCover.url}
                    alt={post.imageCover.altText || ""}
                    className="object-cover"
                    fill
                    quality={50}
                  />
                </div>
              ) : null}
              <ChevronRight className="-ml-1 mr-1 xl:-mt-2 2xl:hidden" />
              <h4 className="upper text-sm !leading-4 tracking-tight text-heading  dark:text-white 2xl:py-2 group-hover:text-primary-public ">
                {post.title}
              </h4>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default SidebarLatestNews;
