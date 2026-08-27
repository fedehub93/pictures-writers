import { notFound } from "next/navigation";

import { EditorType, WidgetSection, WidgetType } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

import { isJSONContent, isWidgetProductPopMetadata } from "@/type-guards";

import { getSettings } from "@/data/settings";
import { getPublishedProductByRootId } from "@/data/product";

import { WidgetProductPop } from "@/shared/components/widget/product-pop";

import { getDraftPostBySlug } from "@/modules/blog/posts/server/queries";
import { PostTemplate } from "@/modules/blog/posts/ui/public/components/post-template";

import { BlogPostingJsonLd } from "@/app/(home)/_components/seo/json-ld/blog-posting";

interface PostDraftSlugViewProps {
  slug: string;
}

export const PostDraftSlugView = async ({ slug }: PostDraftSlugViewProps) => {
  const { siteUrl } = await getSettings();

  const post = await getDraftPostBySlug(slug);

  if (!post) {
    return notFound();
  }

  let bodyImages: string[] = [];
  let bodyVideos: string[] = [];

  if (post.editorType === EditorType.SLATE) {
    bodyImages =
      post.bodyData
        .filter(
          (image) => image.type === "image" && image.url && image.url !== "",
        )
        .map((image) => image.url || "") || [];

    bodyVideos =
      post.bodyData
        .filter(
          (video) => video.type === "video" && video.url && video.url !== "",
        )
        .map((video) => video.url || "") || [];
  }

  if (
    post.editorType === EditorType.TIPTAP &&
    isJSONContent(post.tiptapBodyData)
  ) {
    bodyImages =
      post.tiptapBodyData.content
        ?.filter((image) => image.type === "image" && image.attrs?.src !== "")
        .map((image) => image.attrs?.src || "") || [];

    bodyVideos =
      post.tiptapBodyData.content
        ?.filter((video) => video.type === "youtube" && video.attrs?.src !== "")
        .map((video) => video.attrs?.src || "") || [];
  }

  const widgetPopup = await db.widget.findFirst({
    where: {
      section: WidgetSection.MODAL_POPUP,
      isEnabled: true,
      type: { in: [WidgetType.PRODUCT_POP, WidgetType.NEWSLETTER_POP] },
    },
  });

  const isValidWidgetPopup =
    widgetPopup &&
    widgetPopup.metadata &&
    isWidgetProductPopMetadata(widgetPopup.metadata) &&
    widgetPopup.metadata.productRootId;

  let product = null;

  if (isValidWidgetPopup) {
    product = await getPublishedProductByRootId(
      widgetPopup.metadata.productRootId,
    );
  }

  return (
    <section key={post.slug} className="bg-background py-10">
      <BlogPostingJsonLd
        title={post.seo?.title}
        description={post.seo?.description || ""}
        imageCover={post.imageCover}
        images={bodyImages}
        videos={bodyVideos}
        authors={post.postAuthors.map((a) => a.user)}
        datePublished={post.firstPublishedAt.toISOString()}
        dateModified={post.publishedAt.toISOString()}
        url={`${siteUrl}/${post.slug}`}
      />
      <PostTemplate post={post} />
      {isValidWidgetPopup && product && (
        <WidgetProductPop
          rootId={product.rootId!}
          title={product.title}
          slug={product.slug}
          imageCoverUrl={product.imageCover?.url!}
          label={widgetPopup.metadata.label}
          actionType={widgetPopup.metadata.actionType}
          autoOpenDelay={widgetPopup.metadata.autoOpenDelay}
        />
      )}
    </section>
  );
};
