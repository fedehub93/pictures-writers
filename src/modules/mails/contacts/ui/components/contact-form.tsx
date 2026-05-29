"use client";

import { useController, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";

import { GenericInput } from "@/shared/components/form-component/generic-input";
import { GenericSwitch } from "@/shared/components/form-component/generic-switch";

import { useSuspenseAudiences } from "@/modules/mails/audiences";

import {
  contactInsertSchema,
  ContactInsertValues,
  ContactUpdateValues,
} from "../../schemas";
import { MultiSelectV2 } from "@/shared/components/multi-select-v2";

interface ContactFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  audienceId?: string;
  initialValues?: ContactUpdateValues;
}

const interactionOptions = [
  { label: "user_subscribed", value: "user_subscribed" },
  { label: "first_feedback_request", value: "first_feedback_request" },
  { label: "ebook_downloaded", value: "ebook_downloaded" },
  { label: "webinar_purchased", value: "webinar_purchased" },
];

export const ContactForm = ({
  onSuccess,
  onCancel,
  audienceId,
  initialValues,
}: ContactFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: audiences } = useSuspenseAudiences();

  const form = useForm<ContactInsertValues>({
    resolver: zodResolver(contactInsertSchema),
    values: {
      email: initialValues?.email ?? "",
      firstName: initialValues?.firstName ?? "",
      lastName: initialValues?.lastName ?? "",
      isSubscriber: initialValues?.isSubscriber ?? false,
      audiences: initialValues?.audiences ?? [],
      interactions: initialValues
        ? [
            ...initialValues.interactions.map((interaction) => ({
              id: interaction.interactionType!,
            })),
          ]
        : [],
    },
  });

  const createContact = useMutation(
    trpc.contacts.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.contacts.getMany.queryOptions({ audienceId }),
        );
        toast.success("Contact created successfully!");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const updateContact = useMutation(
    trpc.contacts.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.contacts.getMany.queryOptions({ audienceId }),
        );
        if (initialValues?.id) {
          await queryClient.invalidateQueries(
            trpc.contacts.getOne.queryOptions({ id: initialValues.id }),
          );
        }
        toast.success("Contact updated successfully!");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const isEdit = !!initialValues?.id;
  const isPending = createContact.isPending || updateContact.isPending;

  const onSubmit = (values: ContactInsertValues) => {
    if (isEdit) {
      updateContact.mutate({ ...values, id: initialValues.id });
    } else {
      createContact.mutate(values);
    }
  };

  const { field } = useController({
    control: form.control,
    name: "audiences",
  });
  const { field: fieldInteractions } = useController({
    control: form.control,
    name: "interactions",
  });

  const onSelectAudience = ({ id }: { id: string }) => {
    let newAudiences = [...field.value];
    const audience = field.value.find((v) => v.id === id);
    if (audience) {
      newAudiences = [...field.value.filter((v) => v.id !== id)];
    }
    if (!audience) {
      newAudiences.push({ id });
    }
    field.onChange(newAudiences);
  };

  const onSelectInteraction = ({ id }: { id: string }) => {
    let newInteractions = [...fieldInteractions.value];
    const interaction = fieldInteractions.value.find((v) => v.id === id);
    if (interaction) {
      newInteractions = [...fieldInteractions.value.filter((v) => v.id !== id)];
    }
    if (!interaction) {
      newInteractions.push({ id });
    }
    fieldInteractions.onChange(newInteractions);
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <GenericInput
          control={form.control}
          name="email"
          label="Email"
          placeholder="john.doe@gmail.com"
          disabled={isPending}
        />
        <GenericInput
          control={form.control}
          name="firstName"
          label="First Name"
          placeholder="John"
          disabled={isPending}
        />
        <GenericInput
          control={form.control}
          name="lastName"
          label="Last Name"
          placeholder="Doe"
          disabled={isPending}
        />

        <FormField
          control={form.control}
          name="audiences"
          render={({ field }) => {
            return (
              <FormItem className="min-w-40 flex-auto">
                <FormLabel>Audiences</FormLabel>
                <FormControl>
                  <MultiSelectV2
                    label="audiences"
                    values={field.value}
                    options={audiences?.map((a) => ({
                      id: a.id,
                      label: a.name,
                    }))}
                    onSelectValue={onSelectAudience}
                    showValuesInButton
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="interactions"
          render={({ field }) => {
            return (
              <FormItem className="min-w-40 flex-auto">
                <FormLabel>Interactions</FormLabel>
                <FormControl>
                  <MultiSelectV2
                    label="interactions"
                    values={field.value}
                    options={interactionOptions?.map((a) => ({
                      id: a.value,
                      label: a.label,
                    }))}
                    onSelectValue={onSelectInteraction}
                    showValuesInButton
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <GenericSwitch
          control={form.control}
          name="isSubscriber"
          label="Is Subscriber?"
        />

        <div className="flex justify-between gap-x-2 mt-8">
          {onCancel && (
            <Button
              variant="ghost"
              disabled={isPending}
              type="button"
              onClick={onCancel}
            >
              Cancel
              <FormMessage />
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
