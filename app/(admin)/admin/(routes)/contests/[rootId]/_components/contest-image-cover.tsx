"use client";
import { Media } from "@prisma/client";

import * as z from "zod";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Control, useController } from "react-hook-form";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { contestFormSchema } from "./contest-form";

interface ImageFormProps {
  imageCoverUrl?: string | null;
  control: Control<z.infer<typeof contestFormSchema>>;
  name: "imageCoverId";
}

export const ImageForm = ({ imageCoverUrl, control, name }: ImageFormProps) => {
  const router = useRouter();
  const { onOpen } = useModal();
  const [imageCover, setImageCover] = useState(imageCoverUrl);

  const { field } = useController({ control, name });

  const getImage = (data: Media) => {
    onSubmit({ imageCoverId: data.id, imageUrl: data.url });
  };

  const onSubmit = async ({
    imageCoverId,
    imageUrl,
  }: {
    imageCoverId?: string;
    imageUrl: string;
  }) => {
    try {
      field.onChange(imageCoverId);
      setImageCover(imageUrl);
      toast.success(`Ebook updated`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  const onHandleRemove = () => {
    onSubmit({ imageCoverId: undefined, imageUrl: "" });
  };

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Cover Image</div>
        {field.value && imageCover && (
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
                onClick={() => onOpen("selectAsset", getImage)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={onHandleRemove}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div>
        {!field.value || !imageCover ? (
          <div className="flex w-full items-center justify-center h-32 border border-slate-300 border-dashed rounded-md">
            <Button
              type="button"
              onClick={() => onOpen("selectAsset", getImage)}
            >
              Select file
            </Button>
          </div>
        ) : (
          <div className="w-full flex items-center justify-between">
            <div className="relative aspect-1/2 w-full max-h-60">
              <Image
                alt="upload"
                fill
                className="object-cover rounded-md"
                src={imageCover}
                unoptimized
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
