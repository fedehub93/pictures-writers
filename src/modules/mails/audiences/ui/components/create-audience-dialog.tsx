import { ResponsiveDialog } from "@/shared/components/responsive-dialog";

import { AudienceForm } from "./audience-form";
import { useOpenAudience } from "../../hooks/use-open-audience";

export const CreateAudienceDialog = () => {
  const { isOpen, onClose, data } = useOpenAudience();

  const isEdit = !!data?.id;

  return (
    <ResponsiveDialog
      title={`${isEdit ? "Edit" : "Create"} audience`}
      description={`${isEdit ? "Edit" : "Create"} the audience details`}
      open={isOpen}
      onOpenChange={onClose}
    >
      <AudienceForm onSuccess={() => onClose()} onCancel={() => onClose()} />
    </ResponsiveDialog>
  );
};
