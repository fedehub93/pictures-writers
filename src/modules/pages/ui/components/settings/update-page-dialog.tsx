import { ResponsiveDialog } from "@/shared/components/responsive-dialog";

import { useOpenPageSettings } from "../../../hooks/use-open-page-settings";

import { PageSettings } from "./page-settings";

export const UpdatePageDialog = () => {
  const { isOpen, onClose, data } = useOpenPageSettings();

  return (
    <ResponsiveDialog
      title="Edit Page"
      description="Edit the page details"
      open={isOpen}
      onOpenChange={onClose}
    >
      <PageSettings
        onSuccess={() => onClose()}
        onCancel={() => onClose()}
        initialValues={data}
      />
    </ResponsiveDialog>
  );
};
