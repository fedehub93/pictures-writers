"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Control, useController } from "react-hook-form";
import toast from "react-hot-toast";
import { MoreHorizontal, Trash2 } from "lucide-react";

import { Media } from "@/generated/prisma";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ProductFormValues } from "@/schemas/product";

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";

interface FileFormProps {
  control: Control<ProductFormValues>;
  name: `metadata.formats.${number}.url`;
  sizeName: `metadata.formats.${number}.size`;
}

export const FileForm = ({ control, name, sizeName }: FileFormProps) => {
  const router = useRouter();
  const { onOpen } = useModal();

  const { field } = useController({ control, name });
  const { field: fieldSize } = useController({
    control,
    name: sizeName,
  });

  const getImage = (data: Media) => {
    onSubmit({ fileUrl: data.url, size: data.size || 0 });
  };

  const onSubmit = async ({
    fileUrl,
    size,
  }: {
    fileUrl: string;
    size: number;
  }) => {
    try {
      field.onChange(fileUrl);
      fieldSize.onChange(size);
      toast.success(`Ebook updated`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  const onHandleRemove = () => {
    onSubmit({ fileUrl: "", size: 0 });
  };

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-3 font-semibold">
        URL
      </div>
      {!field.value ? (
        <div className="flex w-full items-center justify-center h-32 border border-slate-300 border-dashed rounded-md">
          <Button type="button" onClick={() => onOpen("selectAsset", getImage)}>
            Select file
          </Button>
        </div>
      ) : (
        <div className="border rounded-md">
          <div className="flex items-center justify-between w-full px-4 py-2 border-b bg-slate-100 dark:bg-secondary">
            <p className="text-muted-foreground text-sm">File</p>
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
          <Link
            href={field.value}
            className="h-auto p-4 truncate block hover:underline"
            target="_blank"
          >
            {field.value}
          </Link>
        </div>
      )}
    </div>
  );
};
