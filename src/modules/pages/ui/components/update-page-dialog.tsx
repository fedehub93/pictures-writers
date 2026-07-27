import { ResponsiveDialog } from "@/shared/components/responsive-dialog";
import { useOpenPage } from "../../hooks/use-open-page";

import { PageForm } from "./page-form";

export const UpdatePageDialog = () => {
  const { isOpen, onClose, data } = useOpenPage();

  return (
    <ResponsiveDialog
      title="Edit Form"
      description="Edit the form details"
      open={isOpen}
      onOpenChange={onClose}
    >
      <PageForm
        onSuccess={() => onClose()}
        onCancel={() => onClose()}
        initialValues={{
          ...data,
          id: data?.id ?? "",
          rootId: data?.rootId ?? "",
          title: data?.title ?? "",
          slug: data?.slug ?? "",
        }}
      />
    </ResponsiveDialog>
  );
};
