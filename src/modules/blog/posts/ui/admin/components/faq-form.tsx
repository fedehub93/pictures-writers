"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { ChevronDownIcon, HelpCircleIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { DialogFooter } from "@/shared/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Form } from "@/shared/ui/form";
import { ResponsiveDialog } from "@/shared/components/responsive-dialog";
import { FaqFieldArrayForm } from "@/shared/components/form-component/faq-field-array-form";

import {
  postUpdateSchema,
  type PostUpdateValues,
} from "../../../schemas";
import { usePostsFilters } from "../../../hooks/use-posts-filters";
import { usePostStore } from "../../../store/use-post-store";

interface FaqFormProps {
  postId: string;
  rootId: string;
  initialData: {
    faqs: {
      id: string;
      question: string;
      answer: string;
      sort: number;
    }[];
  };
}

export const FaqForm = ({ postId, rootId, initialData }: FaqFormProps) => {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters] = usePostsFilters();
  const setStatus = usePostStore((state) => state.setStatus);

  const form = useForm<PostUpdateValues>({
    resolver: zodResolver(postUpdateSchema),
    values: {
      faqs: initialData.faqs ?? [],
    },
    mode: "onChange",
  });

  const { mutate: updatePost, isPending } = useMutation(
    trpc.posts.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.posts.getMany.queryFilter(filters),
        );
        if (rootId) {
          queryClient.invalidateQueries(
            trpc.posts.getLastByRootId.queryFilter({ rootId }),
          );
        }
        setStatus("saved");
        toast.success("FAQ updated successfully");
        setOpen(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      form.reset({ faqs: initialData.faqs ?? [] });
    }
    setOpen(nextOpen);
  };

  const handleSubmit = form.handleSubmit((values) => {
    updatePost({
      id: postId,
      rootId,
      faqs: values.faqs ?? [],
    });
  });

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          FAQ
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <ChevronDownIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => handleOpenChange(true)}>
                <HelpCircleIcon className="size-4 mr-2" />
                FAQ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {initialData.faqs.length} FAQ entries on this version.
        </p>
      </CardContent>

      <ResponsiveDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Edit FAQ"
        description="Add, edit, reorder or remove questions and answers shown in the FAQ section."
      >
        <Form {...form}>
          <form
            id="faq-form"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <FaqFieldArrayForm
              control={form.control}
              isSubmitting={isPending}
            />
          </form>
        </Form>
        <DialogFooter className="mt-6 flex flex-row justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button form="faq-form" type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save FAQ"}
          </Button>
        </DialogFooter>
      </ResponsiveDialog>
    </Card>
  );
};
