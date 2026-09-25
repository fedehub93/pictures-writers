import { ResponsiveDialog } from "@/shared/components/responsive-dialog";

import { useOpenAutomation } from "../../../hooks/use-open-automation";

import { AutomationForm } from "./automation-form";

export const CreateAutomationDialog = () => {
  const { isOpen, onClose, data } = useOpenAutomation();

  return (
    <ResponsiveDialog
      title={data?.id ? "Rename Automation" : "Create Automation"}
      description="Edit the Automation details"
      open={isOpen}
      onOpenChange={onClose}
    >
      <AutomationForm
        data={data}
        onSuccess={() => onClose()}
        onCancel={() => onClose()}
      />
    </ResponsiveDialog>
  );
};