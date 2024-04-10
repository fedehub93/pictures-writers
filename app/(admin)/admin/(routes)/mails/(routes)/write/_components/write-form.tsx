"use client";

import * as z from "zod";
import { EmailTemplate } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import axios from "axios";
import toast from "react-hot-toast";
import { EditorRef, EmailEditorProps } from "react-email-editor";
import dynamic from "next/dynamic";
import { useRef } from "react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ComboboxDemo } from "@/components/combo-box";

interface WriteFormProps {
  templates: EmailTemplate[];
}

const formSchema = z.object({
  emails: z.string().min(1, {
    message: "Email is required",
  }),
  subject: z.string().optional(),
  emailTemplateId: z.string().optional(),
});

const EmailEditor = dynamic(() => import("react-email-editor"), {
  ssr: false,
});

export const WriteForm = ({ templates }: WriteFormProps) => {
  const emailEditorRef = useRef<EditorRef>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emails: "",
      subject: "",
      emailTemplateId: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!isValid) return;

    if (!emailEditorRef?.current?.editor) return;
    emailEditorRef.current.editor.exportHtml(async (data) => {
      const { design, html } = data;
      try {
        // setIsLoading(true);
        await axios.post(`/api/mails/send`, {
          emailRecipient: values.emails,
          subject: values.subject,
          bodyHtml: html,
          emailTemplateId: "",
        });
        toast.success("Sent mail successfully");
      } catch {
        toast.error("Failed to send mail");
      } finally {
        // setIsLoading(false);
      }
    });
  };

  const onLoad: EmailEditorProps["onLoad"] = (editor) => {};

  const onReady: EmailEditorProps["onReady"] = (editor) => {
    const selectedTemplate = templates.find(
      (template) => template.id === form.getValues("emailTemplateId")
    );
    // @ts-ignore
    emailEditorRef.current = { editor };
    if (!emailEditorRef?.current?.editor || !selectedTemplate?.designData)
      return;
    emailEditorRef.current.editor.loadDesign(selectedTemplate.designData);
  };

  const loadTemplate = (id: string) => {
    const selectedTemplate = templates.find((template) => template.id === id);
    const data = selectedTemplate?.designData || null;
    if (!emailEditorRef?.current?.editor) return;
    if (!data) {
      emailEditorRef.current.editor.loadBlank();
    } else {
      emailEditorRef.current.editor.loadDesign(data);
    }
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-y-4 h-full"
        >
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-medium">Write Email</h1>
            <Button type="submit">Send Email</Button>
          </div>
          <FormField
            control={form.control}
            name="emails"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input disabled={isSubmitting} placeholder="To" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-wrap gap-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem className="min-w-40 flex-auto">
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="Subject"
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
                <FormItem className="flex items-center gap-x-2 flex-auto">
                  <ComboboxDemo
                    {...field}
                    onChange={(value) => {
                      loadTemplate(value);
                      field.onChange(value);
                    }}
                    options={templates.map((template) => ({
                      label: template.name,
                      value: template.id,
                    }))}
                  />
                </FormItem>
              )}
            />
          </div>
          <div className="h-full">
            <EmailEditor onReady={onReady} onLoad={onLoad} minHeight="100%" />
          </div>
        </form>
      </Form>
    </>
  );
};
