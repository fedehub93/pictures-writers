"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { GenericInput } from "@/components/form-component/generic-input";
import { GenericTextarea } from "@/components/form-component/generic-textarea";

import { projectFormSchema, ProjectFormValues } from "@/schemas/submission";
import { FileUploadButton } from "@/components/file-upload-button";

interface SubmissionFormProps {}

export default function SubmissionForm({}: SubmissionFormProps) {
  const [submissionJustSent, setSubmissionJustSent] = useState(false);

  const router = useRouter();

  const form = useForm<ProjectFormValues>({
    mode: "all",
    resolver: zodResolver(projectFormSchema),
    values: {
      title: "",
      logline: "",
      file: { key: "", name: "", size: 0, type: "", url: "" },
    },
  });

  const { isSubmitting } = form.formState;

  const disabled = isSubmitting;

  const onSubmit = async (values: ProjectFormValues) => {
    try {
      const res = await fetch("/api/forms/[formId]/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok && data.code === 103) {
        return setSubmissionJustSent(true);
      }

      const submissionId = data.submissionId;

      // router.push(`/submit/${contestId}/summary?submissionId=${submissionId}`);
    } catch (err) {
      console.error("Error, ", err);
    }
  };

  if (submissionJustSent) {
    // return <AlertSubmissionSent contestId={contestId} />;
  }

  return (
    <div className="flex-1 flex flex-col gap-y-4 ">
      <div className="text-2xl font-semibold">Informazioni sottoscrizione</div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="bg-card border rounded-lg shadow-lg p-4 w-full mx-auto h-full flex flex-col space-y-4"
        >
          <GenericInput
            control={form.control}
            name="title"
            label="Titolo"
            placeholder="Qual è il nome del tuo progetto?"
            disabled={disabled}
            className="w-full disabled:bg-muted"
            labelProps={{ className: "text-lg" }}
          />
          <GenericTextarea
            control={form.control}
            name="logline"
            label="Bio"
            placeholder="La logline del tuo progetto"
            className="py-4 w-full h-20 disabled:bg-muted"
            containerProps={{ className: "h-10" }}
            labelProps={{ className: "text-lg" }}
            disabled={disabled}
          />
          <GenericTextarea
            control={form.control}
            name="logline"
            label="Logline"
            placeholder="La logline del tuo progetto"
            className="py-4 w-full h-20 disabled:bg-muted"
            containerProps={{ className: "h-10" }}
            labelProps={{ className: "text-lg" }}
            disabled={disabled}
          />
          <FormField
            control={form.control}
            name="file"
            render={({ field }) => (
              <FormItem className="flex-1 flex flex-col space-y-2">
                <FormLabel className="text-lg">Allegati</FormLabel>
                <FormControl>
                  <FileUploadButton
                    endpoint="submissionAttachments"
                    size="small"
                    value={field.value}
                    onChange={({ key, name, url, size, type }) => {
                      field.onChange({ key, name, url, size, type });
                    }}
                    disabled={disabled}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button type="submit">Invia</Button>
        </form>
      </Form>
    </div>
  );
}
