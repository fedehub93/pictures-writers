"use client";

import { Loader2, SaveIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";

import { Button } from "@/shared/ui/button";

import { useDesigner } from "../store/designer-provider";
import type { FormRootInstance } from "../types/core";

import { PreviewBtn } from "./preview-btn";
import { useFormFilters } from "../../hooks/use-forms-filter";

interface FormActionsProps {
  id: string;
  gtmEventName: string | null;
  content: FormRootInstance | null;
}

export const FormActions = ({
  id,
  gtmEventName,
  content,
}: FormActionsProps) => {
  const { root } = useDesigner((state) => state);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useFormFilters();

  const updateForm = useMutation(
    trpc.forms.updateContent.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.forms.getMany.queryOptions(filters),
        );
        if (id) {
          await queryClient.invalidateQueries(
            trpc.forms.getOne.queryOptions({ id }),
          );
        }
        toast.success("Form updated successfully!");
      },
      onError: (error) => {
        console.error(error);
        toast.error(error.message);
      },
    }),
  );

  const onSave = () => {
    updateForm.mutate({ id, content: root });
  };

  const { isPending } = updateForm;

  return (
    <div className="flex items-center gap-2">
      {content && (
        <PreviewBtn id={id} gtmEventName={gtmEventName} content={content} />
      )}
      {true === true && (
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={onSave}
            disabled={isPending}
            className="transition-none"
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {!isPending && <SaveIcon className="size-4" />}
            Save
          </Button>
          <Button type="button" variant="ghost" disabled={isPending}>
            Publish
          </Button>
        </>
      )}
    </div>
  );
};
