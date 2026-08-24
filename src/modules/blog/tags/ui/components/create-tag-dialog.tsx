import { ResponsiveDialog } from "@/shared/components/responsive-dialog";
import { useOpenTag } from "../../hooks/use-open-tag";

import { TagForm } from "./tag-form";

export const CreateTagDialog = () => {
  const { isOpen, onClose } = useOpenTag();

  return (
    <ResponsiveDialog
      title="Create Tag"
      description="Edit the tag details"
      open={isOpen}
      onOpenChange={onClose}
    >
      <TagForm onSuccess={() => onClose()} onCancel={() => onClose()} />
    </ResponsiveDialog>
  );
};
