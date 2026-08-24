import { ResponsiveDialog } from "@/shared/components/responsive-dialog";
import { useOpenCategory } from "../../hooks/use-open-category";

import { CategoryForm } from "./category-form";

export const CreateCategoryDialog = () => {
  const { isOpen, onClose } = useOpenCategory();

  return (
    <ResponsiveDialog
      title="Create Category"
      description="Edit the category details"
      open={isOpen}
      onOpenChange={onClose}
    >
      <CategoryForm onSuccess={() => onClose()} onCancel={() => onClose()} />
    </ResponsiveDialog>
  );
};
