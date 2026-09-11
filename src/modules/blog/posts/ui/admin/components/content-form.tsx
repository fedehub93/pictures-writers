"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Editor as TiptapEditor } from "@tiptap/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";

import { ContentStatus } from "@/generated/prisma";

import { Form } from "@/shared/ui/form";
import { GenericTiptapV2 } from "@/shared/components/form-component/generic-tiptap-v2";

import { useAutoSave } from "@/modules/blog/shared/hooks/use-auto-save";

import { useAdminSlashCommandModalService } from "@/app/(admin)/_hooks/use-slash-command-modal-service";

import { LinkButtonBubble } from "./link-button-bubble";

import { usePostStore } from "../../../store/use-post-store";

interface BodyFormProps {
  initialData: {
    id: string;
    tiptapBodyData: any;
    status: ContentStatus;
  };
  rootId: string;
  postId: string;
  onEditorReady?: (editor: TiptapEditor | null) => void;
}

const formSchema = z.object({
  tiptapBodyData: z.any().optional(),
});

export const ContentForm = ({
  initialData,
  rootId,
  postId,
  onEditorReady,
}: BodyFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const setStatus = usePostStore((state) => state.setStatus);

  const modalService = useAdminSlashCommandModalService();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      tiptapBodyData: initialData.tiptapBodyData || {
        type: "doc",
        content: [],
      },
    },
    // Ogni autosalvataggio invalida e ri-fetcha la stessa query da cui arriva
    // `initialData` (getLastByRootId): il cambio di riferimento di `values`
    // farebbe partire un reset del form che svuota dirtyFields e riporta i
    // valori allo snapshot del server, cancellando silenziosamente l'ultimo
    // contenuto digitato (l'editor TipTap non viene risincronizzato dal form,
    // quindi il testo resta visibile ma non viene mai salvato).
    // keepDirtyValues preserva i campi con modifiche locali al reset.
    resetOptions: { keepDirtyValues: true, keepDirty: true },
    mode: "onChange",
  });

  const { mutate: updatePost } = useMutation(
    trpc.posts.update.mutationOptions({
      onSuccess: () => {
        // The body update does not affect the post list, so avoid invalidating
        // the grid query on every keystroke. Only refresh the current version.
        if (rootId) {
          queryClient.invalidateQueries(
            trpc.posts.getLastByRootId.queryFilter({ rootId }),
          );
        }
        setStatus("saved");
      },
      onError: (error) => {
        setStatus("error");
        toast.error(error.message);
      },
    }),
  );

  const handleAutoSave = useAutoSave(form, (dirtyData) => {
    setStatus("saving");
    updatePost({
      ...dirtyData,
      id: postId,
      rootId: rootId,
      tiptapBodyData: dirtyData.tiptapBodyData,
    });
  });

  return (
    <div>
      <Form {...form}>
        <div className="flex flex-col gap-4">
          <GenericTiptapV2
            key={initialData.id}
            id={initialData.id}
            control={form.control}
            name="tiptapBodyData"
            onUpdate={handleAutoSave}
            onEditorReady={onEditorReady}
            bubbleMenu
            linkButton={LinkButtonBubble}
            modalService={modalService}
          />
        </div>
      </Form>
    </div>
  );
};
