"use client";

import { useState } from "react";
import axios from "axios";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { MediaType } from "@/generated/prisma";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
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

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { FileUpload } from "@/shared/components/file-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { formatBytes } from "@/lib/format";

const formSchema = z.object({
  key: z.string(),
  name: z.string().min(1, {
    error: "Media name is required",
  }),
  url: z.string().min(1, {
    error: "Media asset url is required",
  }),
  altText: z.optional(z.string()),
  type: z.enum(MediaType),
  size: z.number(),
  mimeType: z.optional(z.string()),
});

type MediaFormValues = z.infer<typeof formSchema>;

interface DuplicateMedia {
  id: string;
  name: string;
}

interface DuplicateState {
  media: DuplicateMedia;
  values: MediaFormValues;
}

export const CreateMediaModal = () => {
  const { isOpen, onClose, type, onCallback } = useModal();
  const router = useRouter();
  const [duplicate, setDuplicate] = useState<DuplicateState | null>(null);
  const [isOverriding, setIsOverriding] = useState(false);

  const isModalOpen = isOpen && type === "createMediaAsset";

  const form = useForm<MediaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      key: "",
      name: "",
      url: "",
      altText: "",
      type: MediaType.IMAGE,
      size: 0,
      mimeType: "",
    },
  });

  const isLoading = form.formState.isSubmitting || isOverriding;

  const submitValues = async (values: MediaFormValues, override = false) => {
    try {
      if (override) setIsOverriding(true);

      const response = await axios.post("/api/media", { ...values, override });

      onCallback?.(response.data);
      form.reset();
      setDuplicate(null);
      onClose();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setDuplicate({ media: error.response.data.media, values });
        return;
      }

      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Something went wrong";

      toast.error(message);
    } finally {
      setIsOverriding(false);
      router.refresh();
    }
  };

  const onSubmit = (values: MediaFormValues) => submitValues(values);

  const handleClose = () => {
    form.reset();
    setDuplicate(null);
    onClose();
  };

  const useExisting = () => {
    if (!duplicate) return;

    onCallback?.(duplicate.media);
    toast.success(`Using "${duplicate.media.name}"`);
    setDuplicate(null);
    form.reset();
    onClose();
    router.refresh();
  };

  const uploadAnyway = () => {
    if (!duplicate) return;

    const { values } = duplicate;
    setDuplicate(null);
    void submitValues(values, true);
  };

  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white text-black p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            Create new asset
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500">
            Add an image, audio, video or file in order to use in your contents.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4 px-6">
              <div className="flex items-center justify-center text-center">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FileUpload
                          endpoint="mediaAsset"
                          value={field.value}
                          onChange={({ key, name, url, size, mimeType }) => {
                            field.onChange(url);
                            form.setValue("key", key);
                            form.setValue("name", name);
                            form.setValue("size", size);
                            form.setValue("mimeType", mimeType ?? "");

                            if (mimeType?.startsWith("image/")) {
                              form.setValue("type", MediaType.IMAGE);
                            } else if (mimeType) {
                              form.setValue("type", MediaType.FILE);
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-between w-full gap-x-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-secondary/70">
                        Asset Type
                      </FormLabel>
                      <Select
                        disabled={isLoading}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-zinc-300/50 border-0 focus:ring-0 text-black ring-offset-0 focus:ring-offset-0 capitalize outline-hidden">
                            <SelectValue placeholder="Select asset type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(MediaType).map((type) => (
                            <SelectItem
                              key={type}
                              value={type}
                              className="capitalize"
                            >
                              {type.toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="uppercase text-xs font-bold text-zinc-500 dark:text-secondary/70">
                        Size
                      </FormLabel>
                      <FormControl>
                        <div className="text-sm">
                          <Input
                            disabled={true}
                            className="hidden"
                            placeholder="Enter asset name"
                            hidden
                            {...field}
                          />
                          <span className="block mt-4">
                            {formatBytes(field.value)}
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                        placeholder="Enter asset name"
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
              <Button disabled={isLoading}>Create</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    <AlertDialog
      open={duplicate !== null}
      onOpenChange={(open) => {
        if (!open) setDuplicate(null);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>This file is already in the library</AlertDialogTitle>
          <AlertDialogDescription>
            &quot;{duplicate?.media.name}&quot; has the same content. Use the
            existing asset, or upload a second copy with its own name and alt
            text.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={useExisting}>
            Use existing
          </AlertDialogCancel>
          <AlertDialogAction onClick={uploadAnyway} disabled={isOverriding}>
            {isOverriding ? "Uploading..." : "Upload anyway"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
};
