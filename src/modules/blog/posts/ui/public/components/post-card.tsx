import Image from "next/image";
import Link from "next/link";
import { User } from "@/generated/prisma";

import { MEDIA_IMAGE_DEFAULT_QUALITY } from "@/modules/media/lib/image-ladder.mjs";
import { getAuthorsString } from "@/data/user";

import { PostInfo } from "./post-info";

interface PostCardProps {
  title: string;
  description: string;
  slug: string;
  categories: { title: string; slug: string }[];
  imageCoverUrl: string;
  imageCoverAlt: string;
  imageCoverBlurDataURL?: string | null;
  authors: User[];
  updatedAt: Date;
}

export const PostCard = ({
  title,
  description,
  slug,
  categories,
  imageCoverUrl,
  imageCoverAlt,
  imageCoverBlurDataURL,
  authors,
  updatedAt,
}: PostCardProps) => {
  const authorsString = getAuthorsString(authors);

  return (
    <article
      key={title}
      className="relative top-0 mb-10 shadow-lg transition-all duration-300 hover:-top-1 hover:shadow-2xl"
    >
      <Link
        href={`/${slug}`}
        className=" flex min-h-full flex-col bg-primary-foreground no-underline"
      >
        <div className="relative aspect-video w-full">
          {imageCoverUrl.length ? (
            <Image
              src={imageCoverUrl}
              alt={imageCoverAlt || "Post card"}
              fill
              sizes="(max-width:1280px) 90vw, 40vw"
              quality={MEDIA_IMAGE_DEFAULT_QUALITY}
              className="object-cover"
              {...(imageCoverBlurDataURL
                ? {
                    placeholder: "blur",
                    blurDataURL: imageCoverBlurDataURL,
                  }
                : {})}
            />
          ) : null}
        </div>
        <div className="flex grow  flex-col justify-between p-5">
          <PostInfo
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
