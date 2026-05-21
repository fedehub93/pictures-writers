import { SlateRendererV2 } from "@/components/editor/view/slate-renderer";

import { CustomElement } from "@/app/(admin)/_components/editor";

export const PostPreview = ({
  post,
}: {
  post: { bodyData: CustomElement[] };
}) => {
  return <SlateRendererV2 content={post.bodyData} preview />;
};
