"use client";

import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

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
import { ComboboxDemo } from "@/components/combo-box";
import { EmailTemplate } from "@prisma/client";

interface SingleSendCreateFormProps {
  templates: EmailTemplate[];
}

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required",
  }),
  designData: z.any(),
  emailTemplateId: z.string().optional(),
});

const SingleSendCreateForm = ({ templates }: SingleSendCreateFormProps) => {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      designData: {},
      emailTemplateId: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await axios.post("/api/mails/single-sends", values);
      router.push(`/admin/mails/single-sends/${response.data.id}`);

      toast.success("Single send created");
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex md:items-center md:justify-center h-full p-6">
      <div>
        <h1 className="text-2xl font-medium">Name your single send</h1>
        <p className="text-sm text-slate-600">
          What would you like to name your single send? Don&apos;t worry, you
          can change this later.
        </p>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 mt-8"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Single Send Name</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="e.g. Newsletter #1 of January 2024"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emailTemplateId"
              render={({ field }) => (
                <FormItem className="flex-auto">
                  <FormLabel>Email template</FormLabel>
                  <FormControl>
                    <ComboboxDemo
                      {...field}
                      options={templates.map((template) => ({
                        label: template.name,
                        value: template.id,
                      }))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-2">
              <Link href="/admin/mails/single-sends">
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
      </div>
    </div>
  );
};

export default SingleSendCreateForm;