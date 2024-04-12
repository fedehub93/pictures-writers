"use client";

import { useRef, useState } from "react";
import axios from "axios";
import { EmailTemplate } from "@prisma/client";
import dynamic from "next/dynamic";
import { EditorRef, EmailEditorProps } from "react-email-editor";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { EmailTemplateActions } from "./actions";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";

interface EmailEditorForm {
  template: EmailTemplate;
}

const EmailEditor = dynamic(() => import("react-email-editor"), {
  ssr: false,
});

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required",
  }),
  description: z.string().optional(),
});

export const EmailEditorForm = ({ template }: EmailEditorForm) => {
  const emailEditorRef = useRef<EditorRef>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: template.name,
      description: template.description || "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onDelete = async () => {
    try {
      setIsLoading(true);

      await axios.delete(`/api/mails/templates/${template.id}`);

      toast.success("Item deleted!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.push(`/admin/mails/templates`);
      router.refresh();
      setIsLoading(false);
    }
  };

  const onSave = async () => {
    try {
      setIsLoading(true);

      if (!isValid) return;

      if (!emailEditorRef?.current?.editor) return;

      emailEditorRef.current.editor.saveDesign(async (design: any) => {
        if (!emailEditorRef?.current?.editor) return;

        emailEditorRef.current.editor.exportHtml(async (data) => {
          const { design, html } = data;
          await axios.patch(`/api/mails/templates/${template.id}`, {
            name: form.getValues("name"),
            description: form.getValues("description"),
            designData: design,
            bodyHtml: html,
          });

          toast.success("Template saved successfully");
        });
      });
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
      setIsLoading(false);
    }
  };

  const exportHtml = () => {
    if (!emailEditorRef?.current?.editor) return;
    emailEditorRef.current.editor.exportHtml((data) => {
      const { design, html } = data;
    });
  };

  const onLoad: EmailEditorProps["onLoad"] = (editor) => {};

  const onReady: EmailEditorProps["onReady"] = (editor) => {
    // @ts-ignore
    emailEditorRef.current = { editor };
    if (!emailEditorRef?.current?.editor) return;
    emailEditorRef.current.editor.loadDesign(template.designData);
  };

  return (
    <div className="py-2 px-6 max-w-7xl mx-auto h-full flex flex-col gap-y-4 overflow-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Email template setup</h1>
        <div className="flex items-center gap-x-2">
          <span className="text-sm text-slate-700">
            {/* Complete all fields {completionText} */}
          </span>
          <EmailTemplateActions
            onSave={onSave}
            onDelete={onDelete}
            isLoading={isLoading}
          />
        </div>
      </div>
      <Form {...form}>
        <form className="flex flex-wrap gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="sm:min-w-80 w-full sm:w-auto ">
                <FormLabel>Template Name</FormLabel>
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
            name="description"
            render={({ field }) => (
              <FormItem className="flex-1 w-full sm:w-auto">
                <FormLabel>Template description</FormLabel>
                <FormControl>
                  <Input
                    disabled={isSubmitting}
                    placeholder="e.g. Newsletter about all January news"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
      <EmailEditor onReady={onReady} onLoad={onLoad} />
    </div>
  );
};
