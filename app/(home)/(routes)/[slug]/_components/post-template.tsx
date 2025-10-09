import Image from "next/image";
import { EditorType } from "@prisma/client";

import { PostWithImageCoverWithCategoryWithTagsWithSeo } from "@/lib/post";

import { getPlaceholderImage } from "@/lib/image";

import { SlateRendererV2 } from "@/components/editor/view/slate-renderer";
import Sidebar from "@/app/(home)/_components/sidebar";
import PostInfoV2 from "@/app/(home)/(routes)/blog/_components/post-info-v2";

import { TipTapRendererV2 } from "@/components/tiptap-renderer";

import { WidgetPostBottom } from "./post-bottom";
import { normalizeContent } from "@/components/tiptap-renderer/helpers/normalize-content";
import { db } from "@/lib/db";

interface PostTemplateProps {
  post: PostWithImageCoverWithCategoryWithTagsWithSeo;
}

export const PostTemplate = async ({ post }: PostTemplateProps) => {
  if (!post.postCategories.length) return null;

  /**
   * TEMP - devo sviluppare funzionaltà per escludere tag, categorie, articoli
   */

  let normalizedContent = post.tiptapBodyData;

  if (
    post.slug !== "laboratorio-di-scrittura-di-un-soggetto-cinematografico-2025"
  ) {
    const blocks = await db.adBlock.findMany({
      where: {
        campaign: {
          isActive: true,
        },
        isActive: true,
      },
      include: {
        items: true,
      },
    });

    if (post.editorType === EditorType.TIPTAP) {
      normalizedContent = normalizeContent(post.tiptapBodyData, {
        adBlocks: blocks,
        totalWordCount: 5000,
      });
    }
  }

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
                quality={100}
              />
            ) : null}
          </div>
          <PostInfoV2
            authors={post.postAuthors.map((v) => v.user)}
            publishedAt={post.publishedAt!}
            categories={post.postCategories.map((c) => c.category)}
          />
          <div className="mx-auto mb-4 max-w-5xl">
            <h1 className="blog-post__title">{post.title}</h1>
          </div>

          {post.editorType === EditorType.SLATE && (
            <SlateRendererV2 content={post.bodyData} />
          )}
          {post.editorType === EditorType.TIPTAP && (
            <TipTapRendererV2 content={normalizedContent} />
          )}
        </article>
        <WidgetPostBottom postId={post.id} tags={post.tags} />
        {/* <DisqusLazy config={disqusOptions} /> */}
      </div>
      <div className="blog-post__sidebar">
        <Sidebar postId={post.id} postCategories={post.postCategories} />
      </div>
    </div>
  );
};
