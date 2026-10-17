"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Form } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";

import { useTRPC } from "@/trpc/client";

import { GenericInput } from "@/shared/components/form-component/generic-input";
import { GenericTextarea } from "@/shared/components/form-component/generic-textarea";
import { GenericSwitch } from "@/shared/components/form-component/generic-switch";
import { GenericMultiSelect } from "@/shared/components/form-component/generic-multi-select";

import {
  emailAccountInsertSchema,
  EmailAccountInsertValues,
} from "../../schemas";
import { EmailAccountGetOne } from "../../types";

interface EmailAccountFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: EmailAccountGetOne;
}

export const EmailAccountForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: EmailAccountFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: users, isLoading: isLoadingUsers } = useQuery(
    trpc.emailAccounts.getAssignableUsers.queryOptions(),
  );

  const form = useForm<EmailAccountInsertValues>({
    resolver: zodResolver(emailAccountInsertSchema),
    values: {
      name: initialValues?.name ?? "",
      email: initialValues?.email ?? "",
      displayName: initialValues?.displayName ?? "",
      signature: initialValues?.signature ?? "",
      isActive: initialValues?.isActive ?? true,
      isDefault: initialValues?.isDefault ?? false,
      userIds:
        initialValues?.userPermissions.map((permission) => permission.userId) ??
        [],
    },
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries(
      trpc.emailAccounts.getMany.queryOptions(),
    );

    if (initialValues?.id) {
      await queryClient.invalidateQueries(
        trpc.emailAccounts.getOne.queryOptions({ id: initialValues.id }),
      );
    }
  };

  const createAccount = useMutation(
    trpc.emailAccounts.create.mutationOptions(),
  );
  const updateAccount = useMutation(
    trpc.emailAccounts.update.mutationOptions(),
  );
  const setUserPermissions = useMutation(
    trpc.emailAccounts.setUserPermissions.mutationOptions(),
  );

  const isEdit = !!initialValues?.id;
  const isPending =
    createAccount.isPending ||
    updateAccount.isPending ||
    setUserPermissions.isPending;

  const onSubmit = async (values: EmailAccountInsertValues) => {
    try {
      if (isEdit) {
        await updateAccount.mutateAsync({
          id: initialValues!.id,
          name: values.name,
          email: values.email,
          displayName: values.displayName,
          signature: values.signature,
          isActive: values.isActive,
          isDefault: values.isDefault,
        });
        await setUserPermissions.mutateAsync({
          id: initialValues!.id,
          userIds: values.userIds,
        });
        toast.success("Email account updated successfully!");
      } else {
        await createAccount.mutateAsync(values);
        toast.success("Email account created successfully!");
      }

      await invalidate();
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-wrap gap-4">
          <GenericInput
            control={form.control}
            name="name"
            label="Name"
            placeholder="Support"
            containerProps={{ className: "min-w-40 flex-auto" }}
            disabled={isPending}
          />
          <GenericInput
            control={form.control}
            name="email"
            label="Email address"
            type="email"
            placeholder="support@mail.pictureswriters.com"
            containerProps={{ className: "min-w-40 flex-auto" }}
            disabled={isPending}
          />
        </div>

        <GenericInput
          control={form.control}
          name="displayName"
          label="Display name"
          placeholder="Pictures Writers Support"
          disabled={isPending}
        />

        <GenericTextarea
          control={form.control}
          name="signature"
          label="Signature"
          placeholder="Kind regards,\nThe Pictures Writers team"
          rows={4}
          disabled={isPending}
        />

        <GenericMultiSelect
          control={form.control}
          name="userIds"
          label="Users"
          data={(users ?? []).map((user) => ({
            id: user.id,
            label: user.name || user.email || "Unnamed user",
            imageUrl: user.imageUrl ?? undefined,
          }))}
          isLoading={isLoadingUsers}
          disabled={isPending}
        />

        <div className="flex flex-col gap-2">
          <GenericSwitch
            control={form.control}
            name="isActive"
            label="Active"
            description="Inactive accounts stop receiving and sending mail."
            disabled={isPending}
          />
          <GenericSwitch
            control={form.control}
            name="isDefault"
            label="Default account"
            description="The account selected by default in the Conversations inbox."
            disabled={isPending}
          />
        </div>

        <div className="flex justify-end gap-x-2 mt-8">
          {onCancel && (
            <Button
              variant="ghost"
              disabled={isPending}
              type="button"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button disabled={isPending} type="submit">
            {isEdit ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
