"use client";

import axios from "axios";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { redirect, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

import { AdBlock, AdItem } from "@prisma/client";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { adBlockFormSchema, AdBlockFormValues } from "@/schemas/ads";

import { BlockDetails } from "./block-details";
import { BlockItems } from "./block-items-form";
import { BlockPositionForm } from "./block-position-form";
import { BlockVisibilityForm } from "./block-visibility-form";
import { BlockStatusForm } from "./block-status-form";

interface BlockFormProps {
  initialData: AdBlock & {
    items: AdItem[];
  };
  apiUrl: string;
}

export const BlockForm = ({ initialData, apiUrl }: BlockFormProps) => {
  const router = useRouter();

  const form = useForm<AdBlockFormValues>({
    mode: "all",
    resolver: zodResolver(adBlockFormSchema),
    defaultValues: { ...initialData },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: AdBlockFormValues) => {
    try {
      await axios.patch(`${apiUrl}/${initialData.id}`, values);
      toast.success(`Block updated`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  if (!initialData || !initialData.id) {
    return redirect(`/admin/ads/${initialData.campaignId}/blocks/`);
  }

  const itemsString = initialData.items
    .map((i) => `${i.id}-${i.sort}`)
    .join("_");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-6 max-w-5xl mx-auto h-full">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-medium">Block setup</h1>
            <div className="flex items-center gap-x-2">
              <Button>Save</Button>
            </div>
          </div>
          <div className=" grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 pt-6 h-full">
            <div className="col-span-full md:col-span-4 lg:col-span-8">
              <div className="flex flex-col gap-y-4">
                <BlockDetails
                  control={form.control}
                  isSubmitting={isSubmitting}
                />
                <BlockVisibilityForm
                  control={form.control}
                  isSubmitting={isSubmitting}
                />
                <BlockPositionForm
                  control={form.control}
                  isSubmitting={isSubmitting}
                />
                <BlockItems
                  key={itemsString}
                  control={form.control}
                  campaignId={initialData.campaignId}
                  blockId={initialData.id}
                  isSubmitting={isSubmitting}
                  items={initialData.items}
                />
              </div>
            </div>
            <div className="col-span-full md:col-span-2 lg:col-span-4 flex flex-col gap-y-4">
              <BlockStatusForm
                control={form.control}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
};
