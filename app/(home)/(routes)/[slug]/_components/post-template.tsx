import Image from "next/image";

import { PostWithImageCoverWithCategoryWithTagsWithSeo } from "@/lib/post";

import { getPlaceholderImage } from "@/lib/image";

import CustomSlateView from "@/components/editor/view";

import PostInfo from "@/app/(home)/(routes)/blog/_components/post-info";

import TagsWidget from "./tags-widget";
import NewsletterWidget from "./newsletter-widget";
import AuthorWidget from "./author-widget";
import Sidebar from "./sidebar";
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
            ) : // <OptimizedImage image={post.imageCover} />
            null}
          </div>
          <PostInfo
            authorName={`${post.user?.firstName} ${post.user?.lastName}`}
            publishedAt={post.publishedAt!}
            categoryTitle={post.category?.title!}
            categorySlug={post.category?.slug!}
          />
          <div className="mx-auto mb-4 max-w-5xl">
            <h1 className="blog-post__title">{post.title}</h1>
          </div>

          <div className="post">
            <CustomSlateView nodes={post.bodyData} />
          </div>
        </article>
        <WidgetPostBottom
          postId={post.id}
          authorId={post.userId || ""}
          tags={post.tags}
        />
        {/* <DisqusLazy config={disqusOptions} /> */}
      </div>
      <div className="blog-post__sidebar">
        <Sidebar postId={post.id} categoryId={post.category?.id} />
      </div>
    </div>
  );
};
