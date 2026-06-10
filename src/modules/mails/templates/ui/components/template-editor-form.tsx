"use client";

import { useRef, useState } from "react";
import { EditorRef, EmailEditorProps } from "react-email-editor";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { Trash2Icon } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { Form } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";

import { GenericInput } from "@/shared/components/form-component/generic-input";
import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

import { TemplateGetOne } from "../../types";
import { templateUpdateSchema, TemplateUpdateValues } from "../../schemas";

interface EmailEditorFormProps {
  template: TemplateGetOne;
}

const EmailEditor = dynamic(() => import("react-email-editor"), {
  ssr: false,
});

export const TemplateEditorForm = ({ template }: EmailEditorFormProps) => {
  const emailEditorRef = useRef<EditorRef>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<TemplateUpdateValues>({
    resolver: zodResolver(templateUpdateSchema),
    values: {
      id: template.id,
      name: template.name,
      description: template.description ?? "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const updateTemplate = useMutation(
    trpc.templates.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.templates.getMany.queryOptions());
        toast.success("Template saved successfully!");
      },
      onError: (error) => {
        toast.error(error.message || "Something went wrong");
      },
    }),
  );

  const deleteTemplate = useMutation(
    trpc.templates.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.templates.getMany.queryOptions());
        toast.success("Template deleted successfully!");
        router.push("/admin/mails/templates");
        router.refresh();
      },
      onError: (error) => {
        toast.error(error.message || "Something went wrong");
      },
    }),
  );

  const onDelete = async () => {
    try {
      setIsLoading(true);
      deleteTemplate.mutate({ id: template.id });
    } finally {
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
          updateTemplate.mutate({
            id: template.id,
            name: form.getValues("name"),
            description: form.getValues("description"),
            designData: design,
            bodyHtml: html,
          });
        });
      });
    } finally {
      router.refresh();
      setIsLoading(false);
    }
  };

  const onLoad: EmailEditorProps["onLoad"] = (editor) => {};

  const onReady: EmailEditorProps["onReady"] = (editor) => {
    emailEditorRef.current = { editor };
    if (!emailEditorRef?.current?.editor) return;
    emailEditorRef.current.editor.loadDesign(template.designData);
  };

  return (
    <div className="py-4 px-6 mx-auto h-full flex flex-col gap-y-4 overflow-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Email template setup</h1>
        <div className="flex items-center gap-x-2">
          <Button
            type="button"
            onClick={onSave}
            disabled={isLoading || !isValid}
            variant="default"
          >
            Save
          </Button>
          <ConfirmModal onConfirm={onDelete}>
            <Button variant="destructive" disabled={isLoading}>
              <Trash2Icon className="h-4 w-4" />
            </Button>
          </ConfirmModal>
        </div>
      </div>
      <Form {...form}>
        <form className="flex flex-wrap gap-4">
          <GenericInput
            control={form.control}
            name="name"
            label="Template Name"
            placeholder="Newsletter #1 of January 2024"
            disabled={isSubmitting}
          />
          <GenericInput
            control={form.control}
            name="description"
            label="Template Description"
            placeholder="Newsletter about all January news"
            disabled={isSubmitting}
          />
        </form>
      </Form>
      <div className="border h-full flex rounded overflow-hidden">
        <EmailEditor onReady={onReady} onLoad={onLoad} />
      </div>
    </div>
  );
};
