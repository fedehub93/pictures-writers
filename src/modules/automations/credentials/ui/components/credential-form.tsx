"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/shared/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";

const createCredentialFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  secret: z.string().min(1, "Secret is required"),
});

const editCredentialFormSchema = createCredentialFormSchema.extend({
  secret: z.string(),
});

export type CredentialFormValues = z.infer<typeof editCredentialFormSchema>;

interface CredentialFormProps {
  onSubmit: (values: CredentialFormValues) => void;
  onCancel?: () => void;
  isPending?: boolean;
  isEditing?: boolean;
  defaultValues?: Partial<CredentialFormValues>;
  submitLabel?: string;
}

export const CredentialForm = ({
  onSubmit,
  onCancel,
  isPending,
  isEditing = false,
  defaultValues,
  submitLabel = "Create",
}: CredentialFormProps) => {
  const form = useForm<CredentialFormValues>({
    resolver: zodResolver(
      isEditing ? editCredentialFormSchema : createCredentialFormSchema,
    ),
    defaultValues: {
      name: defaultValues?.name ?? "",
      type: defaultValues?.type ?? "",
      secret: defaultValues?.secret ?? "",
    },
  });

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="SendGrid" disabled={isPending} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <FormControl>
                <Input
                  placeholder="api-key"
                  disabled={isPending || isEditing}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="secret"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Secret{isEditing ? " (leave blank to keep current)" : ""}
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={isEditing ? "Enter a new secret" : "••••••••"}
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between gap-x-2 pt-2">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
};
