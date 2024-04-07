"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { EmailTemplate } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

interface EmailTesterFormProps {
  templates: EmailTemplate[];
}

const formSchema = z.object({
  emailRecipient: z
    .string()
    .min(1, { message: "Email recipient is required" })
    .email("This is not a valid email."),
  emailTemplateId: z.string().optional(),
});

export const EmailTesterForm = ({ templates }: EmailTesterFormProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emailRecipient: "",
      emailTemplateId: "",
    },
  });

  const { isValid, isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      await axios.post(`/api/mails/send`, {
        ...values,
      });
      toast.success("Sent mail successfully");
    } catch {
      toast.error("Failed to send mail");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-100 dark:bg-background p-4 w-full rounded-md flex flex-col">
      <h2 className="text-base text-muted-foreground">Test email</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-8">
          <div className="flex flex-wrap gap-4">
            <FormField
              control={form.control}
              name="emailRecipient"
              render={({ field }) => (
                <FormItem className="flex-auto min-w-40">
                  <FormLabel>Email recipient</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="support@pictureswriters.com"
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
                <FormItem className="flex-auto min-w-40">
                  <FormLabel>Template</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue="">
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an email template" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.name} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
          <div className="flex items-center gap-x-2 justify-end">
            <Button type="submit" disabled={isLoading || !isValid}>
              Send Email
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
