import { SlateRendererV2 } from "@/components/editor/view/slate-renderer";
import { PostWithImageCoverWithCategoryWithTagsWithSeo } from "@/lib/post";

export const PostPreview = ({
  post,
}: {
  post: PostWithImageCoverWithCategoryWithTagsWithSeo;
}) => {
  return <SlateRendererV2 content={post.bodyData} preview />;
};
