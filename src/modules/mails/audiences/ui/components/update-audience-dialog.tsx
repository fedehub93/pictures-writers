import { ResponsiveDialog } from "@/shared/components/responsive-dialog";

import { AudienceForm } from "./audience-form";
import { useOpenAudience } from "../../hooks/use-open-audience";

export const UpdateAudienceDialog = () => {
  const { isOpen, onClose, data } = useOpenAudience();
  return (
    <ResponsiveDialog
      title="Edit Audience"
      description="Edit the audience details"
      open={isOpen}
      onOpenChange={onClose}
    >
      <AudienceForm
        onSuccess={() => onClose()}
        onCancel={() => onClose()}
        initialValues={data}
      />
    </ResponsiveDialog>
  );
};
