import Image from "next/image";
import Link from "next/link";
import { User } from "@/generated/prisma";

import { getPlaceholderImage } from "@/lib/image";
import { getAuthorsString } from "@/data/user";
import PostInfoV2 from "./post-info-v2";

interface PostCardProps {
  id: string;
  title: string;
  description: string;
  slug: string;
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
  categories,
  imageCoverUrl,
  imageCoverAlt,
  authors,
  updatedAt,
}: PostCardProps) => {
  const imageWithPlaceholder = await getPlaceholderImage(imageCoverUrl);
  const authorsString = getAuthorsString(authors);

  return (
    <article
      key={title}
      className="relative top-0 mb-10 shadow-lg transition-all duration-300 hover:-top-1 hover:shadow-2xl"
    >
      <Link
        href={`/${slug}`}
        prefetch
        className=" flex min-h-full flex-col bg-primary-foreground no-underline"
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
        <div className="flex grow  flex-col justify-between p-5">
          <PostInfoV2
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
