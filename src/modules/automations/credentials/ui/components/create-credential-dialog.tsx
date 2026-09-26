"use client";

import { ResponsiveDialog } from "@/shared/components/responsive-dialog";
import { useCreateCredential, useUpdateCredential } from "../../hooks/use-credentials";
import { useOpenCredential } from "../../hooks/use-open-credential";

import { CredentialForm } from "./credential-form";

export const CreateCredentialDialog = () => {
  const { isOpen, onClose, data } = useOpenCredential();
  const createCredential = useCreateCredential();
  const updateCredential = useUpdateCredential();

  const onSubmit = (values: { name: string; type: string; secret: string }) => {
    if (data?.id) {
      updateCredential.mutate(
        {
          id: data.id,
          name: values.name,
          type: values.type,
          secret: values.secret || undefined,
        },
        { onSuccess: () => onClose() },
      );
      return;
    }

    createCredential.mutate(values, { onSuccess: () => onClose() });
  };

  return (
    <ResponsiveDialog
      title={data?.id ? "Edit Credential" : "Create Credential"}
      description="Save an encrypted credential reference for automation nodes"
      open={isOpen}
      onOpenChange={onClose}
    >
      <CredentialForm
        defaultValues={
          data
            ? {
                name: data.name,
                type: data.type,
                secret: "",
              }
            : undefined
        }
        submitLabel={data?.id ? "Save" : "Create"}
        isEditing={!!data?.id}
        onSubmit={onSubmit}
        isPending={createCredential.isPending || updateCredential.isPending}
        onCancel={() => onClose()}
      />
    </ResponsiveDialog>
  );
};
