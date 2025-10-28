import Image from "next/image";
import Link from "next/link";

import { WidgetPostCategoryFilter, WidgetPostType } from "@/types";
import { getWidgetPosts } from "@/data/widget";

interface WidgetPostProps {
  label: string;
  posts: { rootId: string; sort: number }[];
  postType: WidgetPostType;
  postCategoryRootId?: string;
  postCategories?: {
    category: {
      rootId: string | null;
    };
  }[];
  categoryFilter: WidgetPostCategoryFilter;
  categories: string[];
  limit: number;
}

export const WidgetPost = async ({
  label,
  postType,
  posts,
  postCategories,
  categoryFilter,
  categories,
  limit,
}: WidgetPostProps) => {
  const postData = await getWidgetPosts({
    postType,
    posts,
    postCategories,
    categoryFilter,
    categories,
    limit,
  });

  return (
    <div className="w-full bg-white px-6 pt-8 pb-2 shadow-md flex flex-col gap-y-2">
      <h3 className="mb-4 text-sm font-extrabold uppercase">{label}</h3>

      <div className="flex flex-col">
        {postData.map((post) => {
          return (
            <Link
              key={post.title}
              href={`/${post.slug}`}
              className="flex items-center md:items-start text-gray-600  flex-col group gap-y-2 mb-4"
              prefetch
            >
              {post.imageCover ? (
                <div className="aspect-video relative w-full block">
                  <Image
                    src={post.imageCover.url}
                    alt={post.imageCover.altText || ""}
                    className="object-cover"
                    fill
                    sizes="(max-width:1280px) 90vw, 25vw"
                    quality={50}
                  />
                </div>
              ) : null}
              <h4 className="upper text-sm leading-4! tracking-tight text-heading  dark:text-whitepy-2 group-hover:text-primary-public ">
                {post.title}
              </h4>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default WidgetPost;
