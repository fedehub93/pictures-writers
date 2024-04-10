"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { EmailAudience, EmailContact } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import MultipleSelector from "@/components/multi-select";

interface EditContactFormProps {
  contact: EmailContact & { audiences: EmailAudience[] };
  options: { label: string; value: string }[];
}

const audiencesOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

const formSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z
    .string()
    .min(1, {
      message: "Email receiver required",
    })
    .email("This is not a valid email."),
  audiences: z.array(audiencesOptionSchema),
});

export const EditContactForm = ({ contact, options }: EditContactFormProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: contact?.firstName || "",
      lastName: contact?.lastName || "",
      email: contact?.email,
      audiences: contact
        ? [
            ...contact.audiences.map((audience) => ({
              label: audience.name,
              value: audience.id,
            })),
          ]
        : [],
    },
  });

  const { isValid, isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);

      await axios.patch(`/api/mails/contacts/${contact.id}`, {
        ...values,
      });

      toast.success("Contact updated successfully");
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
      setIsLoading(false);
    }
  };

  const onChangeAudience = (value: z.infer<typeof audiencesOptionSchema>[]) => {
    form.setValue("audiences", value);
  };

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
                      disabled={isLoading || isSubmitting}
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
                      disabled={isLoading || isSubmitting}
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
                      disabled={isLoading || isSubmitting}
                      placeholder="mario.rossi@email.com"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="audiences"
              render={({ field }) => {
                return (
                  <FormItem className="min-w-40 flex-auto">
                    <FormLabel>Audiences</FormLabel>
                    <FormControl>
                      <MultipleSelector
                        value={field.value}
                        onChange={onChangeAudience}
                        defaultOptions={options}
                        placeholder="Select audiences..."
                        className="bg-background"
                        emptyIndicator={
                          <p className="text-center text-lg leading-10">
                            no results found.
                          </p>
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
          <div className="flex items-center gap-x-2 justify-end">
            <Button
              type="submit"
              disabled={!isValid || isSubmitting || isLoading}
            >
              Save
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
