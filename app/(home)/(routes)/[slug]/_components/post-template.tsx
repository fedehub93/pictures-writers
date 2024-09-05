import { PostVersionWithImageCoverWithCategoryWithTags } from "@/lib/post";
import Image from "next/image";
import PostInfo from "../../blog/_components/post-info";
import { SlateView } from "slate-to-react";
import {
  Blockquote,
  BulletedList,
  HeadingFour,
  HeadingOne,
  HeadingThree,
  HeadingTwo,
  ImageElement,
  Link,
  ListItem,
  Paragraph,
} from "@/components/editor/view/elements";
import { RichText } from "@/components/editor/view/leaves";
import Sidebar from "@/components/sidebar";

import TagsWidget from "./tags-widget";
import NewsletterWidget from "./newsletter-widget";
import AuthorWidget from "./author-widget";

interface PostTemplateProps {
  post: PostVersionWithImageCoverWithCategoryWithTags;
}

export const PostTemplate = ({ post }: PostTemplateProps) => {
  return (
    <section className="blog-post">
      <div className="blog-post__post">
        <article className="blog-post__article">
          <div className="blog-post__image-container">
            {post.imageCover ? (
              <Image
                src={post.imageCover.url}
                alt={post.imageCover.altText || ""}
                fill
                className="blog-post__image"
              />
            ) : null}
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
            <SlateView
              nodes={post.bodyData!}
              transforms={{
                elements: [
                  Paragraph,
                  HeadingOne,
                  HeadingTwo,
                  HeadingThree,
                  HeadingFour,
                  Link,
                  Blockquote,
                  BulletedList,
                  ListItem,
                  ImageElement,
                ],
                leaves: [RichText],
              }}
            />
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
      <div className="blog-post__sidebar sticky top-20">
        <Sidebar />
      </div>
    </section>
  );
};
