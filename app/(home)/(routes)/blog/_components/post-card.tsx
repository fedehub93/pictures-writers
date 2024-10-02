import Image from "next/image";
import Link from "next/link";

import { getPlaceholderImage } from "@/lib/image";
import PostInfo from "./post-info";

interface PostCardProps {
  id: string;
  title: string;
  description: string;
  slug: string;
  categoryTitle: string;
  categorySlug: string;
  imageCoverUrl: string;
  imageCoverAlt: string;
  authorName: string;
  updatedAt: Date;
}

const PostCard = async ({
  id,
  title,
  description,
  slug,
  categoryTitle,
  categorySlug,
  imageCoverUrl,
  imageCoverAlt,
  authorName,
  updatedAt,
}: PostCardProps) => {
  const imageWithPlaceholder = await getPlaceholderImage(imageCoverUrl);

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
              quality={70}
              className="object-cover"
              placeholder="blur"
              blurDataURL={imageWithPlaceholder.placeholder}
            />
          ) : null}
        </div>
        <div className="flex flex-grow  flex-col justify-between p-5">
          <PostInfo
            categoryTitle={categoryTitle}
            categorySlug={categorySlug}
            authorName={authorName}
            publishedAt={updatedAt}
          />
          <h2 className="m-0 mb-4 text-xl font-extrabold uppercase">{`${title}`}</h2>
          <p className="text-sm">{description}</p>
          <span className="mt-6 text-xs font-semibold uppercase tracking-wider text-[#999]">
            {authorName}
          </span>
        </div>
      </Link>
    </article>
  );
};

export default PostCard;
