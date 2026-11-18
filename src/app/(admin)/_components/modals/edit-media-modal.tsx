"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";

import { useTRPC } from "@/trpc/client";

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";

import { mediaErrorMessage } from "@/modules/media/lib/error-message";
import { useMediaInvalidation } from "@/modules/media/hooks/use-media-invalidation";

const formSchema = z.object({
  name: z.string().min(1, {
    error: "Media name is required",
  }),
  altText: z.optional(z.string()),
});

export const EditMediaModal = () => {
  const { isOpen, onClose, type, data } = useModal();

  const trpc = useTRPC();
  const update = useMutation(trpc.media.update.mutationOptions());
  const { invalidateLibrary } = useMediaInvalidation();

  const isModalOpen = isOpen && type === "editMediaAsset";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: data?.name,
      altText: data?.altText,
    },
  });

  const isLoading = form.formState.isSubmitting || update.isPending;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!data?.id) {
      toast.error("The Media to update is missing.");
      return;
    }

    try {
      await update.mutateAsync({
        id: data.id,
        name: values.name,
        altText: values.altText ?? null,
      });

      toast.success("Media updated");
      form.reset();
      onClose();
      // Refresh the grid and the header through the shared cache; the dialog
      // does not wait for the refetch and no route reload happens.
      void invalidateLibrary();
    } catch (error) {
      toast.error(mediaErrorMessage(error));
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  useEffect(() => {
    form.setValue("name", data?.name);
    form.setValue("altText", data?.altText);
  }, [form, data?.name, data?.altText, isOpen]);

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white text-black p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            Edit Media
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500">
            Change the name and alt text. The stored file and every reference
            stay the same.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4 px-6">
              <div className="flex items-center justify-center text-center"></div>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-secondary/70">
                      Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        className="bg-zinc-300/50 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0"
                        placeholder="Enter Media name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="altText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-secondary/70">
                      Alt text
                    </FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        className="bg-zinc-300/50 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0"
                        placeholder="Enter alternative text"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="bg-gray-100 px-6 py-4">
              <Button disabled={isLoading}>Update</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
