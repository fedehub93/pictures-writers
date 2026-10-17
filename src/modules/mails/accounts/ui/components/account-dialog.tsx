"use client";

import { ResponsiveDialog } from "@/shared/components/responsive-dialog";

import { useOpenEmailAccount } from "../../hooks/use-open-account";
import { EmailAccountForm } from "./account-form";

export const EmailAccountDialog = () => {
  const { isOpen, onClose, data } = useOpenEmailAccount();

  const isEdit = !!data?.id;

  return (
    <ResponsiveDialog
      title={`${isEdit ? "Edit" : "Create"} email account"`}
      description={`${isEdit ? "Edit" : "Create"} the email account details`}
      open={isOpen}
      onOpenChange={onClose}
    >
      <EmailAccountForm
        initialValues={data}
        onSuccess={() => onClose()}
        onCancel={() => onClose()}
      />
    </ResponsiveDialog>
  );
};
