import Image from "next/image";

import { PostWithImageCoverWithCategoryWithTagsWithSeo } from "@/lib/post";

import { getPlaceholderImage } from "@/lib/image";
import CustomSlateView from "@/components/editor/view";

import Sidebar from "@/app/(home)/_components/sidebar";
import PostInfo from "@/app/(home)/(routes)/blog/_components/post-info";

import TagsWidget from "./tags-widget";
import NewsletterWidget from "./newsletter-widget";
import AuthorWidget from "./author-widget";

interface PostTemplateProps {
  post: PostWithImageCoverWithCategoryWithTagsWithSeo;
}

export const PostTemplate = async ({ post }: PostTemplateProps) => {
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
        <TagsWidget tags={post.tags!} />
        <NewsletterWidget />
        {/* <DisqusLazy config={disqusOptions} /> */}
        {post.user && (
          <AuthorWidget
            firstName={post.user.firstName || ""}
            lastName={post.user.lastName || ""}
            bio={post.user.bio || ""}
            imageUrl={post.user.imageUrl || ""}
          />
        )}
      </div>
      <div className="blog-post__sidebar sticky -top-20">
        <Sidebar />
      </div>
    </div>
  );
};
