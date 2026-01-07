"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useController, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  EmailAudience,
  EmailContact,
  EmailContactInteraction,
} from "@/prisma/generated/client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

import { useAudiencesQuery } from "@/app/(admin)/_hooks/use-audiences-query";
import { MultiSelectV2 } from "@/components/multi-select-v2";

interface EditContactFormProps {
  contact: EmailContact & {
    audiences: EmailAudience[];
    interactions: EmailContactInteraction[];
  };
  interactionOptions: { label: string; value: string }[];
}

const audiencesOptionSchema = z.object({
  id: z.string(),
});

const interactionsOptionSchema = z.object({
  id: z.string(),
});

const formSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.email().min(1, {
    error: "Email receiver required",
  }),
  audiences: z.array(audiencesOptionSchema),
  interactions: z.array(interactionsOptionSchema),
  isSubscriber: z.boolean(),
});

export const EditContactForm = ({
  contact,
  interactionOptions,
}: EditContactFormProps) => {
  const router = useRouter();

  const { data: audiences, isLoading, isError } = useAudiencesQuery();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: contact?.firstName || "",
      lastName: contact?.lastName || "",
      email: contact?.email,
      isSubscriber: contact?.isSubscriber,
      audiences: contact
        ? [
            ...contact.audiences.map((audience) => ({
              id: audience.id,
            })),
          ]
        : [],
      interactions: contact
        ? [
            ...contact.interactions.map((interaction) => ({
              id: interaction.interactionType,
            })),
          ]
        : [],
    },
  });

  const { isValid, isSubmitting } = form.formState;

  const { field } = useController({
    control: form.control,
    name: "audiences",
  });
  const { field: fieldInteractions } = useController({
    control: form.control,
    name: "interactions",
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/mails/contacts/${contact.id}`, {
        ...values,
      });

      toast.success("Contact updated successfully");
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

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

  if (isError) return <div>Error...</div>;

  return (
    <div className="bg-slate-100 dark:bg-background p-4 w-full rounded-md">
      <h2 className="text-base text-muted-foreground">Set contact</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-8">
          <div className="flex flex-wrap gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem className="min-w-40 flex-auto">
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="Mario"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem className="min-w-40 flex-auto">
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="Rossi"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem className="min-w-40 flex-auto">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="mario.rossi@email.com"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isSubscriber"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Is subscriber?</FormLabel>
                    <FormDescription>
                      Prevent all search engines that support the noindex rule
                      from indexing this page.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {isLoading && (
            <div className="flex-auto space-y-2">
              <label className="text-sm font-medium leading-none">
                Audiences
              </label>
              <Skeleton className="w-full h-[40px] bg-white space-y-4" />
            </div>
          )}
          {!isLoading && audiences && (
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
          )}
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
          <div className="flex items-center gap-x-2 justify-end">
            <Button type="submit" disabled={!isValid || isSubmitting}>
              Save
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
