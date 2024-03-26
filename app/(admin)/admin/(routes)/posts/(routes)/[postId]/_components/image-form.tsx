"use client";
import { Post } from "@prisma/client";

import * as z from "zod";
import toast from "react-hot-toast";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { FileUpload } from "@/components/file-upload";
import { ImageIcon, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";

interface ImageFormProps {
  initialData: Post;
  postId: string;
}

const formSchema = z.object({
  imageUrl: z.optional(
    z
      .string()
      .min(1, {
        message: "Image is required",
      })
      .nullable()
  ),
});

export const ImageForm = ({ initialData, postId }: ImageFormProps) => {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/posts/${postId}`, values);
      toast.success("Post updated");
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  const onHandleRemove = () => {
    onSubmit({ imageUrl: null });
  };

  return (
    <div
      className={cn(
        "border-l-4 dark:bg-slate-900 p-4 transition-all flex flex-col gap-y-2",
        isFocused && "border-l-blue-500"
      )}
    >
      <div className="flex items-center justify-between">Image cover</div>
      {!initialData.imageUrl ? (
        <FileUpload
          endpoint="postImage"
          onChange={({ url }) => {
            if (url) {
              onSubmit({ imageUrl: url });
            }
          }}
          setIsFocused={setIsFocused}
        />
      ) : (
        <div className="border rounded-md">
          <div className="flex items-center justify-between w-full px-4 py-2 border-b">
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
            <div className="flex-1">
              ciao
            </div>
            <div className="relative aspect-video w-36 h-36">
              <Image
                alt="upload"
                fill
                className="object-cover rounded-md"
                src={initialData.imageUrl}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
