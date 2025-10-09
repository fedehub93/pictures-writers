"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import toast from "react-hot-toast";
import { redirect, useRouter } from "next/navigation";
import { AdBlock, AdCampaign } from "@prisma/client";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { adCampaignFormSchema, AdCampaignFormValues } from "@/schemas/ads";

import { CampaignDetails } from "./campaign-details-form";
import { CampaignBlocks } from "./campaign-block-form";
import { CampaignStatus } from "./campaign-status";

interface CampaignFormProps {
  initialData: AdCampaign & {
    blocks: AdBlock[];
  };
  apiUrl: string;
}

export const CampaignForm = ({ initialData, apiUrl }: CampaignFormProps) => {
  const router = useRouter();

  const form = useForm<AdCampaignFormValues>({
    mode: "all",
    resolver: zodResolver(adCampaignFormSchema),
    defaultValues: { ...initialData },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: AdCampaignFormValues) => {
    try {
      await axios.patch(`${apiUrl}/${initialData.id}`, values);
      toast.success(`Campaign updated`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  if (!initialData || !initialData.id) {
    return redirect("/admin/ads");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-6 max-w-5xl mx-auto h-full">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-medium">Campaign setup</h1>
            <div className="flex items-center gap-x-2">
              <Button>Save</Button>
            </div>
          </div>
          <div className=" grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 pt-6 h-full">
            <div className="col-span-full md:col-span-4 lg:col-span-8">
              <div className="flex flex-col gap-y-4">
                <CampaignDetails
                  control={form.control}
                  isSubmitting={isSubmitting}
                />
                <CampaignBlocks
                  campaignId={initialData.id}
                  blocks={initialData.blocks}
                  isSubmitting={isSubmitting}
                />
              </div>
            </div>
            <div className="col-span-full md:col-span-2 lg:col-span-4 flex flex-col gap-y-4">
              <CampaignStatus
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
