"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useController, useForm } from "react-hook-form";
import { EditorRef, EmailEditorProps } from "react-email-editor";
import dynamic from "next/dynamic";
import { useRef } from "react";
import { SendIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import { GenericInput } from "@/shared/components/form-component/generic-input";
import { MultiSelectV2 } from "@/shared/components/multi-select-v2";

import { useSuspenseAudiences } from "@/modules/mails/audiences";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

import { singleSendUpdateSchema, SingleSendUpdateValues } from "../../schemas";
import { GetSingleSendGetOne } from "../../types";
import { ProgressDialog } from "@/app/(admin)/_components/modals/progress-dialog";

interface WriteFormProps {
  singleSend: GetSingleSendGetOne;
}

const EmailEditor = dynamic(() => import("react-email-editor"), {
  ssr: false,
});

export const WriteForm = ({ singleSend }: WriteFormProps) => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const emailEditorRef = useRef<EditorRef>(null);

  // const { data: audiences, isLoading, isError } = useAudiencesQuery();
  const { data: audiences, isLoading, isError } = useSuspenseAudiences();

  const form = useForm<SingleSendUpdateValues>({
    resolver: zodResolver(singleSendUpdateSchema),
    values: {
      id: singleSend.id,
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

  const updateSingleSend = useMutation(
    trpc.singleSends.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.singleSends.getMany.queryOptions(),
        );

        if (singleSend.id) {
          await queryClient.invalidateQueries(
            trpc.singleSends.getOne.queryOptions({ id: singleSend.id }),
          );
        }

        router.refresh();
        toast.success("Single send updated");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const removeSingleSend = useMutation(
    trpc.singleSends.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.singleSends.getMany.queryOptions());

        router.push(`/admin/mails/single-sends`);
      },
    }),
  );

  const onRemove = () => {
    removeSingleSend.mutate({ id: singleSend.id });
  };

  const onSubmit = (values: SingleSendUpdateValues) => {
    if (!emailEditorRef?.current?.editor) return;

    emailEditorRef.current.editor.exportHtml(async (data) => {
      const { design, html } = data;
      form.setValue("designData", design);
      form.setValue("bodyHtml", html);

      updateSingleSend.mutate({
        id: singleSend.id,
        name: values.name,
        audiences: values.audiences,
        subject: values.subject,
        designData: design,
        bodyHtml: html,
      });
    });
  };

  const sendSingleSend = useMutation(
    trpc.singleSends.sendBulk.mutationOptions({
      onSuccess() {
        toast.success("Broadcast sent successfully!");
      },
      onError: (error) => {
        toast.error(error.message || "Error sending broadcast");
      },
    }),
  );

  const sendIsPending = sendSingleSend.isPending;

  const onSend = () => {
    if (!emailEditorRef?.current?.editor) return;

    emailEditorRef.current.editor.exportHtml(async (data) => {
      const { design, html } = data;
      form.setValue("designData", design);
      form.setValue("bodyHtml", html);

      sendSingleSend.mutate({ singleSendId: singleSend.id });

      router.refresh();
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
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-y-4 min-h-screen"
        >
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-medium">Write Email</h1>
            <div className="flex gap-x-2 itemscen">
              <ConfirmModal onConfirm={onRemove}>
                <Button variant="destructive">
                  <Trash2Icon className="size-4" />
                </Button>
              </ConfirmModal>
              <Button type="submit" disabled={isSubmitting || !isValid}>
                Save Single Send
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onSend()}
                disabled={isSubmitting || !isValid}
              >
                <SendIcon className="size-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 items-start">
            <GenericInput
              control={form.control}
              name="subject"
              label="Subject"
              containerProps={{ className: "min-w-40 flex-auto h-2" }}
            />
            <FormField
              control={form.control}
              name="audiences"
              render={({ field }) => {
                return (
                  <FormItem className="flex flex-col gap-x-8 min-w-2/5">
                    <FormLabel>Audiences</FormLabel>
                    {!isLoading && audiences ? (
                      <>
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
                      </>
                    ) : (
                      <Skeleton className="min-w-2/5 h-9" />
                    )}
                  </FormItem>
                );
              }}
            />
          </div>
          <div className="h-full border rounded overflow-hidden">
            <EmailEditor onReady={onReady} onLoad={onLoad} minHeight="100%" />
          </div>
        </form>
      </Form>
      <ProgressDialog
        title="Sending Broadcast"
        description="We are sending your broadcast email. Please do not close this window."
        isProcessing={sendIsPending}
      />
    </>
  );
};
