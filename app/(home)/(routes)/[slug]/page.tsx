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
import NewsletterWidget from "./_components/newsletter-widget";
import AuthorWidget from "./_components/author-widget";
import { getPublishedCategoryBySlug } from "@/lib/category";
import { PostTemplate } from "./_components/post-template";

export const Page = async ({ params }: { params: { slug: string } }) => {
  const post = await getPublishedPostBySlug(params.slug);

  if (post) {
    return <PostTemplate post={post} />;
  }

  const category = await getPublishedCategoryBySlug(params.slug);
  if (!category) {
    return <div>Page not found</div>;
  }

  return (
    // <section className="blog-post">
    //   <div className="blog-post__post">
    //     <article className="blog-post__article">
    //       <div className="blog-post__image-container">
    //         {post.imageCover ? (
    //           <Image
    //             src={post.imageCover.url}
    //             alt={post.imageCover.altText || ""}
    //             fill
    //             className="blog-post__image"
    //           />
    //         ) : null}
    //       </div>
    //       <PostInfo
    //         authorName={`${post.user?.firstName} ${post.user?.lastName}`}
    //         publishedAt={post.publishedAt!}
    //         categoryTitle={post.category?.title!}
    //         categorySlug={post.category?.slug!}
    //       />
    //       <div className="mx-auto mb-4 max-w-5xl">
    //         <h1 className="blog-post__title">{post.title}</h1>
    //       </div>

    //       <div className="post">
    //         <SlateView
    //           nodes={post.bodyData!}
    //           transforms={{
    //             elements: [
    //               Paragraph,
    //               HeadingOne,
    //               HeadingTwo,
    //               HeadingThree,
    //               HeadingFour,
    //               Link,
    //               Blockquote,
    //               BulletedList,
    //               ListItem,
    //               ImageElement,
    //             ],
    //             leaves: [RichText],
    //           }}
    //         />
    //       </div>
    //     </article>
    //     <TagsWidget tags={post.tags!} />
    //     <NewsletterWidget />
    //     {/* <DisqusLazy config={disqusOptions} /> */}
    //     {post.user && (
    //       <AuthorWidget
    //         firstName={post.user.firstName || ""}
    //         lastName={post.user.lastName || ""}
    //         bio={post.user.bio || ""}
    //         imageUrl={post.user.imageUrl || ""}
    //       />
    //     )}
    //   </div>
    //   <div
    //     className="blog-post__sidebar sticky top-20"
    //     // ref={matchesXL ? stickyRef : undefined}
    //   >
    //     <Sidebar />
    //   </div>
    // </section>
    <div>Page not found</div>
  );
};

export default Page;
