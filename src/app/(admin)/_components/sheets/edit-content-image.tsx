"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import Image from "next/image";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { useSheet } from "@/app/(admin)/_hooks/use-sheet-store";

const formSchema = z.object({
  url: z.string().optional(),
  altText: z.string().optional(),
});

export const EditContentImageSheet = () => {
  const { isOpen, onClose, type, data, onCallback } = useSheet();

  const isSheetOpen = isOpen && type === "editContentImage";
  const { image } = data;
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      altText: "",
    },
  });

  useEffect(() => {
    if (image) {
      form.setValue("url", image.url);
      form.setValue("altText", image.altText);
    }
  }, [image, form, isOpen]);

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      onCallback(values);
      onClose();
    } catch (error) {
      console.log(error);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-[800px] sm:w-[800px]">
        <SheetHeader>
          <SheetTitle>Edit image</SheetTitle>
          <SheetDescription>
            Edit your image. Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="my-4 dark:bg-slate-900 transition-all flex flex-col gap-y-4 p-4">
              <div className="flex items-center justify-between">Image</div>
              <div className="relative w-64 rounded-md aspect-video overflow-hidden">
                <Image
                  src={image?.url}
                  alt="ciao"
                  fill
                  className="object-cover rounded-md"
                  unoptimized
                />
              </div>
              <div className="flex items-center justify-between">Alt Text</div>
              <FormField
                control={form.control}
                name="altText"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder="Enter alternative text"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <SheetFooter className="py-2 px-0">
                <Button disabled={isLoading}>Save</Button>
              </SheetFooter>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};
