"use client";

import { useRouter } from "next/navigation";

import { ResponsiveDialog } from "@/shared/components/responsive-dialog";

import { TemplateForm } from "./template-form";
import { useOpenTemplate } from "../../hooks/use-open-template";

export const CreateTemplateDialog = () => {
  const router = useRouter();
  const { isOpen, onClose, id } = useOpenTemplate();

  const isEdit = !!id;

  return (
    <ResponsiveDialog
      title={`${isEdit ? "Edit" : "Create"} template`}
      description={`${isEdit ? "Edit" : "Create"} the template details`}
      open={isOpen}
      onOpenChange={onClose}
    >
      <TemplateForm
        onSuccess={(id?: string) => {
          router.push(`/admin/mails/templates/${id}`);
          onClose();
        }}
        onCancel={() => onClose()}
      />
    </ResponsiveDialog>
  );
};
