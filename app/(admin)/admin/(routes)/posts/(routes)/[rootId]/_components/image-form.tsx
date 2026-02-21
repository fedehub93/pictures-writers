"use client";
import { ContentStatus, Media, Post } from "@/generated/prisma";

import * as z from "zod";
import toast from "react-hot-toast";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { useModal } from "@/app/(admin)/_hooks/use-modal-store";

interface ImageFormProps {
  initialData: {
    status: ContentStatus;
  } & {
    imageCover: {
      url: string;
      name: string | null;
      altText: string | null;
    } | null;
  };
  rootId: string;
  postId: string;
}

const formSchema = z.object({
  imageCover: z.optional(z.custom<Media>().nullable()),
});

export const ImageForm = ({ initialData, rootId, postId }: ImageFormProps) => {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);
  const { onOpen } = useModal();

  const getImage = (data: Media) => {
    onSubmit({ imageCover: data });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (initialData.status === ContentStatus.PUBLISHED) {
      try {
        await axios.post(`/api/posts/${rootId}/versions`, {
          imageCoverId: values.imageCover?.id || null,
        });
        toast.success(`Item updated`);
      } catch {
        toast.error("Something went wrong");
      } finally {
        router.refresh();
      }

      return;
    }

    try {
      await axios.patch(`/api/posts/${rootId}/versions/${postId}`, {
        imageCoverId: values.imageCover?.id || null,
      });
      toast.success(`Item updated`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  const onHandleRemove = () => {
    onSubmit({ imageCover: null });
  };

  return (
    <div
      className={cn(
        "border-l-4 dark:bg-slate-900 p-4 transition-all flex flex-col gap-y-2",
        isFocused && "border-l-blue-500"
      )}
    >
      <div className="flex items-center justify-between">Image cover</div>
      {!initialData.imageCover ? (
        <div className="flex w-full items-center justify-center h-56 border border-slate-300 border-dashed rounded-md">
          <Button type="button" onClick={() => onOpen("selectAsset", getImage)}>
            Select asset
          </Button>
        </div>
      ) : (
        <div className="border rounded-md">
          <div className="flex items-center justify-between w-full px-4 py-2 border-b bg-slate-100 dark:bg-secondary">
            <p className="text-muted-foreground text-sm">Image</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-6 w-6 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={onHandleRemove}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="w-full flex items-center justify-between h-40 p-4">
            <div className="flex-1 text-muted-foreground">
              {initialData.imageCover.name}
            </div>
            <div className="relative aspect-video w-36 h-36">
              <Image
                alt="upload"
                fill
                className="object-cover rounded-md"
                src={initialData.imageCover.url}
                unoptimized
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
