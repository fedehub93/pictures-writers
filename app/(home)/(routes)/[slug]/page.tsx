import { getPublishedPostBySlug } from "@/lib/post";
import Image from "next/image";
import { SlateView } from "slate-to-react";

import Sidebar from "@/components/sidebar";
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
import PostInfo from "../blog/_components/post-info";
import TagsWidget from "./_components/tags-widget";

export const Page = async ({ params }: { params: { slug: string } }) => {
  const post = await getPublishedPostBySlug(params.slug);

  if (!post) {
    return <div>Page not found</div>;
  }

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
            authorName={"Federico Verrengia"}
            publishedAt={post.publishedAt}
            categoryTitle={post.category?.title!}
            categorySlug={post.category?.slug!}
          />
          <div className="mx-auto mb-4 max-w-5xl">
            <h1 className="blog-post__title">{post.title}</h1>
          </div>

          <div className="post">
            <SlateView
              nodes={post.bodyData}
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
        <TagsWidget tags={post.tags} />
        {/* <Newsletter />
          <DisqusLazy config={disqusOptions} />
          <AuthorWidget author={post.author[0]} /> */}
      </div>
      <div
        className="blog-post__sidebar sticky top-20"
        // ref={matchesXL ? stickyRef : undefined}
      >
        <Sidebar />
      </div>
    </section>
  );
};

export default Page;
