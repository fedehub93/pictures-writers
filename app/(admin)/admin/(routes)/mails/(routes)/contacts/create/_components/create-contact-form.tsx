"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";

import MultipleSelector from "@/components/multi-select";
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

interface CreateContactFormProps {
  options: { label: string; value: string }[];
}

const audiencesOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

const formSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().min(1, {
    message: "Email is required",
  }),
  audiences: z.array(audiencesOptionSchema),
});

export const CreateContactForm = ({ options }: CreateContactFormProps) => {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      audiences: [],
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await axios.post("/api/mails/contacts", values);
      router.push(`/admin/mails/contacts/${response.data.id}`);

      toast.success("Contact created");
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-8">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input disabled={isSubmitting} placeholder="Mario" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input disabled={isSubmitting} placeholder="Rossi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  disabled={isSubmitting}
                  placeholder="mario.rossi@email.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
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
        <div className="flex items-center gap-x-2">
          <Link href="/admin/mails/audiences">
            <Button variant="ghost" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={!isValid || isSubmitting}>
            Continue
          </Button>
        </div>
      </form>
    </Form>
  );
};
