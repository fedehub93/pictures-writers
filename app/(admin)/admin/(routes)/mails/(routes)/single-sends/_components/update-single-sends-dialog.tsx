import { ResponsiveDialog } from "@/components/responsive-dialog";
import { SingleSendForm } from "./single-send-form";
import { useOpenSingleSend } from "../_hooks/use-open-single-send";

export const UpdateSingleSendDialog = () => {
  const { isOpen, onClose, id } = useOpenSingleSend();

  const isEdit = !!id;

  return (
    <ResponsiveDialog
      title={`${isEdit ? "Edit" : "Create"} single send`}
      description={`${isEdit ? "Edit" : "Create"} the single send details"`}
      open={isOpen}
      onOpenChange={onClose}
    >
      <SingleSendForm onSuccess={() => onClose()} onCancel={() => onClose()} />
    </ResponsiveDialog>
  );
};
