"use client";

import { useRef, useState } from "react";
import axios from "axios";
import Image from "next/image";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { formatBytes } from "@/lib/format";

const formSchema = z.object({
  name: z.string().min(1, {
    error: "Media name is required",
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
  file: File;
  values: MediaFormValues;
}

function mediaTypeFromMimeType(mimeType: string): MediaType {
  if (mimeType.startsWith("image/")) return MediaType.IMAGE;
  if (mimeType.startsWith("video/")) return MediaType.VIDEO;
  if (mimeType.startsWith("audio/")) return MediaType.AUDIO;
  return MediaType.FILE;
}

export const CreateMediaModal = () => {
  const { isOpen, onClose, type, onCallback } = useModal();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<DuplicateState | null>(null);
  const [isOverriding, setIsOverriding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isModalOpen = isOpen && type === "createMediaAsset";

  const form = useForm<MediaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      altText: "",
      type: MediaType.FILE,
      size: 0,
      mimeType: "",
    },
  });

  const isLoading = form.formState.isSubmitting || isOverriding;

  const updateFile = (next: File | null) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(next);
    setPreviewUrl(next ? URL.createObjectURL(next) : null);

    if (next) {
      form.setValue("name", next.name);
      form.setValue("size", next.size);
      form.setValue("mimeType", next.type);
      form.setValue("type", mediaTypeFromMimeType(next.type));
    } else {
      form.setValue("name", "");
      form.setValue("size", 0);
      form.setValue("mimeType", "");
      form.setValue("type", MediaType.FILE);
    }
  };

  const resetState = () => {
    updateFile(null);
    form.reset();
    setDuplicate(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const submitFile = async (
    values: MediaFormValues,
    selectedFile: File,
    override = false,
  ) => {
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("name", values.name);
    if (values.altText) formData.append("altText", values.altText);
    if (override) formData.append("override", "true");

    return axios.post("/api/media", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  const submitValues = async (values: MediaFormValues, override = false) => {
    if (!file) {
      toast.error("Select a file to upload");
      return;
    }

    try {
      if (override) setIsOverriding(true);

      const response = await submitFile(values, file, override);

      onCallback?.(response.data);
      resetState();
      onClose();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setDuplicate({
          media: error.response.data.media,
          file,
          values,
        });
        return;
      }

      const data = axios.isAxiosError(error)
        ? error.response?.data
        : undefined;
      const message =
        typeof data?.error === "string" ? data.error : "Something went wrong";

      // An oversize file can never succeed, so clear it; a quota refusal keeps
      // the selection, because deleting media makes the same upload valid.
      if (data?.code === "FILE_TOO_LARGE") {
        toast.error(message);
        updateFile(null);
        return;
      }

      toast.error(message);
    } finally {
      setIsOverriding(false);
      router.refresh();
    }
  };

  const onSubmit = (values: MediaFormValues) => submitValues(values);

  const useExisting = () => {
    if (!duplicate) return;

    onCallback?.(duplicate.media);
    toast.success(`Using "${duplicate.media.name}"`);
    resetState();
    onClose();
    router.refresh();
  };

  const uploadAnyway = () => {
    if (!duplicate) return;

    const { values } = duplicate;
    setDuplicate(null);
    void submitValues(values, true);
  };

  const renderPreview = () => {
    if (!file) return null;

    if (file.type.startsWith("image/") && previewUrl) {
      return (
        <div className="relative w-96 h-72 rounded-md overflow-hidden">
          <Image
            src={previewUrl}
            alt="Selected file"
            fill
            className="object-cover"
          />
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center w-96 h-72 rounded-md border border-dashed">
        <span className="text-sm text-zinc-600">{file.name}</span>
      </div>
    );
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
                <div className="flex flex-col items-center justify-center text-center gap-y-2">
                  <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    onChange={(event) =>
                      updateFile(event.target.files?.[0] ?? null)
                    }
                  />
                  {file ? (
                    <div className="relative">
                      {renderPreview()}
                      <button
                        type="button"
                        onClick={() => updateFile(null)}
                        className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-2xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="w-96 h-72 rounded-md border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center text-zinc-500 hover:border-zinc-400 transition"
                    >
                      <span className="text-sm">Click to select a file</span>
                    </button>
                  )}
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
                <Button disabled={isLoading || !file}>Create</Button>
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
