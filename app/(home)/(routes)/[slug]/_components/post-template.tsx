import Image from "next/image";
import { EditorType } from "@/prisma/generated/client";

import { getAdBlocks } from "@/data/ad-blocks";

import { getPlaceholderImage } from "@/lib/image";
import type { GetDraftPostBySlug } from "@/data/post";

import { SlateRendererV2 } from "@/components/editor/view/slate-renderer";

import Sidebar from "@/app/(home)/_components/sidebar";
import PostInfoV2 from "@/app/(home)/(routes)/blog/_components/post-info-v2";

import { TipTapRendererV2 } from "@/components/tiptap-renderer";
import { normalizeContent } from "@/components/tiptap-renderer/helpers/normalize-content";
import { countWordsFromTiptap } from "@/components/tiptap-renderer/helpers/words-counter";

import { WidgetPostBottom } from "./post-bottom";

interface PostTemplateProps {
  post: NonNullable<GetDraftPostBySlug>;
}

export const PostTemplate = async ({ post }: PostTemplateProps) => {
  if (!post.postCategories.length) return null;

  let normalizedContent = post.tiptapBodyData;

  if (post.editorType === EditorType.TIPTAP) {
    const blocks = await getAdBlocks({
      postRootId: post.rootId!,
      categoryRootIds: post.postCategories.map((c) => c.category.rootId!),
      tagRootIds: post.tags.map((t) => t.rootId!),
    });
    normalizedContent = normalizeContent(post.tiptapBodyData, {
      adBlocks: blocks,
      totalWordCount:
        post.tiptapBodyData && typeof post.tiptapBodyData !== "string"
          ? countWordsFromTiptap(post.tiptapBodyData)
          : 0,
    });
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
          {post.tiptapBodyData && post.editorType === EditorType.TIPTAP && (
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
