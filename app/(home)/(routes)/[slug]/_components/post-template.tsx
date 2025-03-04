import Image from "next/image";

import { PostWithImageCoverWithCategoryWithTagsWithSeo } from "@/lib/post";

import { getPlaceholderImage } from "@/lib/image";

import { SlateRendererV2 } from "@/components/editor/view/slate-renderer";
import Sidebar from "@/app/(home)/_components/sidebar";
import PostInfoV2 from "@/app/(home)/(routes)/blog/_components/post-info-v2";

import { WidgetPostBottom } from "./post-bottom";

interface PostTemplateProps {
  post: PostWithImageCoverWithCategoryWithTagsWithSeo;
}

export const PostTemplate = async ({ post }: PostTemplateProps) => {
  if (!post.category?.id) return null;

  const imageWithPlaceholder = await getPlaceholderImage(post.imageCover?.url!);

  return (
    <div className="blog-post">
      <div className="blog-post__post">
        <article className="blog-post__article">
          <div className="blog-post__image-container">
            {post.imageCover ? (
              <Image
                src={post.imageCover.url}
                alt={post.imageCover.altText || ""}
                fill
                sizes="(max-width:1280px) 90vw, 40vw"
                priority
                className="blog-post__image"
                placeholder="blur"
                blurDataURL={imageWithPlaceholder.placeholder}
              />
            ) : null}
          </div>
          <PostInfoV2
            authors={post.postAuthors.map((v) => v.user)}
            publishedAt={post.publishedAt!}
            categoryTitle={post.category?.title!}
            categorySlug={post.category?.slug!}
          />
          <div className="mx-auto mb-4 max-w-5xl">
            <h1 className="blog-post__title">{post.title}</h1>
          </div>

          <SlateRendererV2 content={post.bodyData} />
        </article>
        <WidgetPostBottom
          postId={post.id}
          authorId={post.userId || ""}
          tags={post.tags}
        />
        {/* <DisqusLazy config={disqusOptions} /> */}
      </div>
      <div className="blog-post__sidebar">
        <Sidebar postId={post.id} categoryRootId={post.category?.rootId!} />
      </div>
    </div>
  );
};
