"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useController, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";

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
import { useAudiencesQuery } from "@/app/(admin)/_hooks/use-audiences-query";
import { Skeleton } from "@/components/ui/skeleton";
import { MultiSelectV2 } from "@/components/multi-select-v2";

interface CreateContactFormProps {}

const audiencesOptionSchema = z.object({
  id: z.string(),
});

const formSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().min(1, {
    message: "Email is required",
  }),
  isSubscriber: z.boolean(),
  audiences: z.array(audiencesOptionSchema),
});

export const CreateContactForm = ({}: CreateContactFormProps) => {
  const router = useRouter();

  const { data: audiences, isLoading, isError } = useAudiencesQuery();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      isSubscriber: true,
      audiences: [],
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await axios.post("/api/mails/contacts", values);
      form.reset();
      router.refresh();

      toast.success("Contact created");
    } catch {
      toast.error("Something went wrong");
    }
  };

  const { field } = useController({
    control: form.control,
    name: "audiences",
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
          name="isSubscriber"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Is subscriber?</FormLabel>
                <FormDescription>
                  Prevent all search engines that support the noindex rule from
                  indexing this page.
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
        {isLoading && (
          <div className="flex-auto space-y-2">
            <label className="text-sm font-medium leading-none">
              Audiences
            </label>
            <Skeleton className="w-full h-[40px] space-y-4" />
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
