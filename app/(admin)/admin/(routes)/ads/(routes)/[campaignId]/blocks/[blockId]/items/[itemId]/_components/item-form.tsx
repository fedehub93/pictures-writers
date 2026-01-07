"use client";

import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { redirect, useRouter } from "next/navigation";

import { AdItem } from "@/prisma/generated/client";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { adItemFormSchema, AdItemFormValues } from "@/schemas/ads";
import { ItemDetails } from "./item-details";
import { ItemContent } from "./item-content";

interface ItemFormProps {
  campaignId: string;
  initialData: AdItem;
  apiUrl: string;
}

export const ItemForm = ({
  campaignId,
  initialData,
  apiUrl,
}: ItemFormProps) => {
  const router = useRouter();

  const form = useForm<AdItemFormValues>({
    mode: "all",
    resolver: zodResolver(adItemFormSchema),
    defaultValues: {
      title: initialData.title || "",
      description: initialData.description || "",
      imageUrl: initialData.imageUrl || "",
      url: initialData.url || "",
      sourceType: initialData.sourceType,
      postRootId: initialData.postRootId || "",
      productRootId: initialData.productRootId || "",
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: AdItemFormValues) => {
    try {
      await axios.patch(`${apiUrl}/${initialData.id}`, values);
      toast.success(`Item updated`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  if (!initialData || !initialData.id) {
    return redirect(`/admin/ads/${campaignId}/blocks/${initialData.adBlockId}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-6 max-w-5xl mx-auto h-full">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-medium">Item setup</h1>
            <div className="flex items-center gap-x-2">
              <Button>Save</Button>
            </div>
          </div>
          <div className=" grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 pt-6 h-full">
            <div className="col-span-full md:col-span-4 lg:col-span-8">
              <div className="flex flex-col gap-y-4">
                <ItemDetails
                  control={form.control}
                  isSubmitting={isSubmitting}
                />
                <ItemContent
                  control={form.control}
                  isSubmitting={isSubmitting}
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
};
