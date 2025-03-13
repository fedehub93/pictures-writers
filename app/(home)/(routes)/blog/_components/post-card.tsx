import Image from "next/image";
import Link from "next/link";
import { User } from "@prisma/client";

import { getPlaceholderImage } from "@/lib/image";
import PostInfoV2 from "./post-info-v2";
import { getAuthorsString } from "@/data/user";

interface PostCardProps {
  id: string;
  title: string;
  description: string;
  slug: string;
  categoryTitle: string;
  categorySlug: string;
  categories: { title: string; slug: string }[];
  imageCoverUrl: string;
  imageCoverAlt: string;
  authors: User[];
  updatedAt: Date;
}

const PostCard = async ({
  id,
  title,
  description,
  slug,
  categoryTitle,
  categorySlug,
  categories,
  imageCoverUrl,
  imageCoverAlt,
  authors,
  updatedAt,
}: PostCardProps) => {
  const imageWithPlaceholder = await getPlaceholderImage(imageCoverUrl);
  const authorsString = getAuthorsString(authors);

  return (
    <article key={title} className="mb-10">
      <Link
        href={`/${slug}`}
        prefetch={true}
        className=" relative top-0 flex min-h-full flex-col bg-white text-[#444] no-underline shadow-lg transition-all duration-300 hover:-top-1 hover:shadow-3xl "
      >
        <div className="relative aspect-video w-full">
          {imageCoverUrl.length ? (
            <Image
              src={imageCoverUrl}
              alt={imageCoverAlt || "Post card"}
              fill
              sizes="(max-width:1280px) 90w, 40vw"
              quality={75}
              className="object-cover"
              placeholder="blur"
              blurDataURL={imageWithPlaceholder.placeholder}
            />
          ) : null}
        </div>
        <div className="flex flex-grow  flex-col justify-between p-5">
          <PostInfoV2
            categoryTitle={categoryTitle}
            categorySlug={categorySlug}
            categories={categories}
            authors={authors}
            publishedAt={updatedAt}
          />
          <h2 className="m-0 mb-4 text-xl font-extrabold uppercase">{`${title}`}</h2>
          <p className="text-sm">{description}</p>
          <span className="mt-6 text-xs font-semibold uppercase tracking-wider text-[#999]">
            {authorsString}
          </span>
        </div>
      </Link>
    </article>
  );
};

export default PostCard;
