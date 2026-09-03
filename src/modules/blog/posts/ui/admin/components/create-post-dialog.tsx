import { ResponsiveDialog } from "@/shared/components/responsive-dialog";

import { useOpenPost } from "../../../hooks/use-open-post";

import { PostForm } from "./post-form";

export const CreatePostDialog = () => {
  const { isOpen, onClose, data } = useOpenPost();

  return (
    <ResponsiveDialog
      title="Create Post"
      description="Edit the Post details"
      open={isOpen}
      onOpenChange={onClose}
    >
      <PostForm data={data} onSuccess={() => onClose()} onCancel={() => onClose()} />
    </ResponsiveDialog>
  );
};
