"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useController, useForm } from "react-hook-form";
import axios from "axios";
import { EditorRef, EmailEditorProps } from "react-email-editor";
import dynamic from "next/dynamic";
import { useRef } from "react";
import { SendIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { cn } from "@/lib/utils";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";
import { useProgressLoader } from "@/app/(admin)/_hooks/use-progress-loader-store";
import { MultiSelectV2 } from "@/components/multi-select-v2";
import { useAudiencesQuery } from "@/app/(admin)/_hooks/use-audiences-query";

import { GetSingleSendById } from "../../types";
import { SingleSendInsertValues, singleSendInsertSchema } from "../../schemas";

interface WriteFormProps {
  singleSend: GetSingleSendById;
  todayEmailsAvailable: number;
}

const EmailEditor = dynamic(() => import("react-email-editor"), {
  ssr: false,
});

export const WriteForm = ({
  singleSend,
  todayEmailsAvailable,
}: WriteFormProps) => {
  const router = useRouter();
  const emailEditorRef = useRef<EditorRef>(null);

  const { data: audiences, isLoading, isError } = useAudiencesQuery();
  const { onOpen, onClose, setData } = useProgressLoader();

  const form = useForm<SingleSendInsertValues>({
    resolver: zodResolver(singleSendInsertSchema),
    values: {
      name: singleSend.name || "",
      subject: singleSend.subject || "",
      audiences: singleSend.audiences.map((audience) => ({
        id: audience.id,
      })),
      designData: singleSend.designData,
      bodyHtml: singleSend.bodyHtml || "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const { field } = useController({
    control: form.control,
    name: "audiences",
  });

  const onDelete = async () => {
    try {
      await axios.delete(`/api/admin/mails/single-sends/${singleSend.id}`);

      toast.success("Single send deleted!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.push(`/admin/mails/single-sends`);
      router.refresh();
    }
  };

  const onSubmit = (values: SingleSendInsertValues) => {
    if (!emailEditorRef?.current?.editor) return;

    emailEditorRef.current.editor.exportHtml(async (data) => {
      try {
        const { design, html } = data;
        form.setValue("designData", design);
        form.setValue("bodyHtml", html);
        await axios.patch(`/api/admin/mails/single-sends/${singleSend.id}`, {
          name: values.name,
          audiences: values.audiences,
          subject: values.subject,
          designData: design,
          bodyHtml: html,
        });
        toast.success("Single send updated");
      } catch {
        toast.error("Failed to update");
      } finally {
      }
    });
  };

  const onSend = (values: SingleSendInsertValues) => {
    if (!emailEditorRef?.current?.editor) return;

    emailEditorRef.current.editor.exportHtml(async (data) => {
      try {
        onOpen({ label: "Loading", progress: 0 });

        const urlApi = `/api/admin/mails/single-sends/${singleSend.id}/send`;
        const eventSource = new EventSource(urlApi);

        const { design, html } = data;
        form.setValue("designData", design);
        form.setValue("bodyHtml", html);

        eventSource.onmessage = (event) => {
          const { progress, done } = JSON.parse(event.data);
          setData({ label: "Loading", progress });

          // Controlla se è stato segnalato il completamento
          if (done) {
            onClose();
            eventSource.close();
          }
        };

        eventSource.onerror = (err) => {
          console.error("Errore nell'evento SSE:", err);
          onClose();
          eventSource.close();
        };

        toast.success("Single send updated");
      } catch {
        toast.error("Failed to update");
      } finally {
        router.refresh();
      }
    });
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

  const onLoad: EmailEditorProps["onLoad"] = (editor) => {};

  const onReady: EmailEditorProps["onReady"] = (editor) => {
    // @ts-ignore
    emailEditorRef.current = { editor };
    if (!emailEditorRef?.current?.editor) return;
    emailEditorRef.current.editor.loadDesign(form.getValues("designData"));
  };

  if (isError) return <div>Error...</div>;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-y-4 min-h-screen"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-medium">Write Email</h1>
          <div
            className={cn(
              "text-emerald-700 font-medium",
              todayEmailsAvailable <= 0 && "text-destructive",
            )}
          >
            You have{" "}
            <span className="font-bold">{todayEmailsAvailable} emails</span>{" "}
            left to send today
          </div>
          <div className="flex gap-x-2 itemscen">
            <ConfirmModal onConfirm={onDelete}>
              <Button variant="destructive">
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </ConfirmModal>
            <Button type="submit" disabled={isSubmitting || !isValid}>
              Save Single Send
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onSend(form.getValues())}
              disabled={isSubmitting || !isValid || todayEmailsAvailable <= 0}
            >
              <SendIcon className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
        {isLoading && <Skeleton className="mt-4 w-full h-10" />}
        {!isLoading && audiences && (
          <FormField
            control={form.control}
            name="audiences"
            render={({ field }) => {
              return (
                <FormItem className="flex items-center gap-x-8">
                  <FormControl>
                    <MultiSelectV2
                      label="audiences"
                      isSubmitting={isSubmitting}
                      values={field.value}
                      options={audiences.map((a) => ({
                        id: a.id,
                        label: a.name,
                      }))}
                      onSelectValue={onSelectAudience}
                      showValuesInButton
                    />
                  </FormControl>
                  <FormMessage className="mt-0!" />
                </FormItem>
              );
            }}
          />
        )}
        <div className="flex flex-wrap gap-4 items-start">
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
        </div>
        <div className="h-full border rounded overflow-hidden">
          <EmailEditor onReady={onReady} onLoad={onLoad} minHeight="100%" />
        </div>
      </form>
    </Form>
  );
};
