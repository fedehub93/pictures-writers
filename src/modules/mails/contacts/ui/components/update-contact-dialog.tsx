import { ResponsiveDialog } from "@/shared/components/responsive-dialog";

import { ContactForm } from "./contact-form";
import { useOpenContact } from "../../hooks/use-open-contact";

export const UpdateContactDialog = ({ audienceId }: { audienceId: string }) => {
  const { isOpen, onClose, data } = useOpenContact();
  return (
    <ResponsiveDialog
      title="Edit Contact"
      description="Edit the contact details"
      open={isOpen}
      onOpenChange={onClose}
    >
      <ContactForm
        audienceId={audienceId}
        onSuccess={() => onClose()}
        onCancel={() => onClose()}
        initialValues={data}
      />
    </ResponsiveDialog>
  );
};
