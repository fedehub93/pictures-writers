"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";

import { Form } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { GenericInput } from "@/shared/components/form-component/generic-input";
import { GenericTextarea } from "@/shared/components/form-component/generic-textarea";

import {
  customerInsertSchema,
  CustomerInsertValues,
} from "../../schemas";
import { useCustomerFilters } from "../../hooks/use-customers-filter";
import { type CustomerListItem } from "../../hooks/use-open-customer";

interface CustomerFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: CustomerListItem;
}

export const CustomerForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: CustomerFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters] = useCustomerFilters();

  const form = useForm<CustomerInsertValues>({
    resolver: zodResolver(customerInsertSchema),
    values: {
      email: initialValues?.email ?? "",
      name: initialValues?.name ?? "",
      phone: initialValues?.phone ?? "",
      notes: initialValues?.notes ?? "",
    },
  });

  const createCustomer = useMutation(
    trpc.customers.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.customers.getMany.queryOptions(filters),
        );
        toast.success("Customer created successfully!");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const updateCustomer = useMutation(
    trpc.customers.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.customers.getMany.queryOptions(filters),
        );
        if (initialValues?.id) {
          await queryClient.invalidateQueries(
            trpc.customers.getOne.queryOptions({ id: initialValues.id }),
          );
        }
        toast.success("Customer updated successfully!");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const isEdit = !!initialValues?.id;
  const isPending = createCustomer.isPending || updateCustomer.isPending;

  const onSubmit = (values: CustomerInsertValues) => {
    if (isEdit) {
      updateCustomer.mutate({ ...values, id: initialValues.id });
    } else {
      createCustomer.mutate(values);
    }
  };

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <GenericInput
          control={form.control}
          name="email"
          type="email"
          label="Email"
          placeholder="customer@example.com"
          disabled={isPending}
        />
        <GenericInput
          control={form.control}
          name="name"
          label="Name"
          placeholder="Ada Lovelace"
          disabled={isPending}
        />
        <GenericInput
          control={form.control}
          name="phone"
          label="Phone"
          placeholder="+39 000 000 0000"
          disabled={isPending}
        />
        <GenericTextarea
          control={form.control}
          name="notes"
          label="Notes"
          placeholder="Billing or internal notes"
          disabled={isPending}
        />

        <div className="flex justify-between gap-x-2 mt-4">
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
