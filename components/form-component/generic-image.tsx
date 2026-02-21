"use client";
import { Media } from "@/generated/prisma";

import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Control, FieldValues, Path, useController } from "react-hook-form";
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

interface GenericImageProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  imageUrl?: string | null;
  suggestedDimensions?: string;
}

export const GenericImage = <T extends FieldValues>({
  control,
  name,
  label,
  imageUrl,
  suggestedDimensions,
}: GenericImageProps<T>) => {
  const router = useRouter();
  const { onOpen } = useModal();
  const [image, setImage] = useState(imageUrl);

  const { field } = useController({ control, name });

  const getImage = (data: Media) => {
    onSubmit({ imageId: data.id, imageUrl: data.url });
  };

  const onSubmit = async ({
    imageId,
    imageUrl,
  }: {
    imageId?: string;
    imageUrl: string;
  }) => {
    try {
      field.onChange(imageId);
      setImage(imageUrl);
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  const onHandleRemove = () => {
    onSubmit({ imageId: undefined, imageUrl: "" });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="text-base">{label}</CardTitle>
        {field.value && image && (
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
      </CardHeader>
      <CardContent>
        {!field.value || !image ? (
          <Button
            type="button"
            variant="ghost"
            className=" flex flex-col w-full items-center justify-center h-32 border border-slate-300 border-dashed rounded-md text-muted-foreground"
            onClick={() => onOpen("selectAsset", getImage)}
          >
            <span>Select image</span>
            <span>{suggestedDimensions}</span>
          </Button>
        ) : (
          <div className="w-full flex items-center justify-between">
            <div className="relative aspect-1/2 size-36 flex items-center justify-center w-full">
              <Image
                alt="upload"
                fill
                className="object-cover rounded-md "
                src={image}
                unoptimized
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
