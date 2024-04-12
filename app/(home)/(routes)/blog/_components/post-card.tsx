import Image from "next/image";
import Link from "next/link";
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

const PostCard = ({
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
  return (
    <article key={title} className="mb-10">
      <Link
        href={`/${slug}`}
        className=" relative top-0 flex min-h-full flex-col bg-white text-[#444] no-underline shadow-lg transition-all duration-300 hover:-top-1 hover:shadow-3xl "
      >
        <div className="relative aspect-video w-full">
          {imageCoverUrl.length ? (
            <Image
              src={imageCoverUrl}
              alt={imageCoverAlt || "Post card"}
              fill
              objectFit="cover"
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
