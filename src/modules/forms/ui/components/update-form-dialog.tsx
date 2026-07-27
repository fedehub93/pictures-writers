import { ResponsiveDialog } from "@/shared/components/responsive-dialog";

import { FormForm } from "./form-form";
import { useOpenForm } from "../../hooks/use-open-form";

export const UpdateFormDialog = () => {
  const { isOpen, onClose, data } = useOpenForm();
  return (
    <ResponsiveDialog
      title="Edit Form"
      description="Edit the form details"
      open={isOpen}
      onOpenChange={onClose}
    >
      <FormForm
        onSuccess={() => onClose()}
        onCancel={() => onClose()}
        initialValues={data}
      />
    </ResponsiveDialog>
  );
};
