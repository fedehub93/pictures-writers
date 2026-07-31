import { ResponsiveDialog } from "@/shared/components/responsive-dialog";
import { useOpenPage } from "../../hooks/use-open-page";

import { PageForm } from "./page-form";

export const CreatePageDialog = () => {
  const { isOpen, onClose } = useOpenPage();

  return (
    <ResponsiveDialog
      title="Create Page"
      description="Edit the page details"
      open={isOpen}
      onOpenChange={onClose}
    >
      <PageForm onSuccess={() => onClose()} onCancel={() => onClose()} />
    </ResponsiveDialog>
  );
};
