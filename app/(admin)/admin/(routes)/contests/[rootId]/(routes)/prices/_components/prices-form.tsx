"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import toast from "react-hot-toast";
import { redirect, useRouter } from "next/navigation";
import { ContentStatus, Contest } from "@prisma/client";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { StatusView } from "@/app/(admin)/_components/content/status-view";
import { SeoContentTypeApi } from "@/app/(admin)/_components/seo/types";

import { ContestPricesForm } from "./contest-prices-form";

interface PricesFormProps {
  initialData: Contest & {
    categories: {
      id: string;
      name: string;
    }[];
    deadlines: {
      id: string;
      name: string;
      date: Date;
    }[];
    prices: {
      id: string;
      categoryId: string;
      deadlineId: string;
      price: any;
    }[];
  };
  apiUrl: string;
}

export const PricesFormSchema = z.object({
  prices: z.array(
    z.object({
      id: z.string().optional(),
      categoryId: z.string(),
      deadlineId: z.string(),
      price: z.coerce.number(),
    })
  ),
});

export const PricesForm = ({ initialData, apiUrl }: PricesFormProps) => {
  const router = useRouter();

  // const isDefaultLang = !!languages.find((l) => l.id === langId)?.isDefault;
  const form = useForm<z.infer<typeof PricesFormSchema>>({
    mode: "all",
    resolver: zodResolver(PricesFormSchema),
    values: {
      ...initialData,
      prices: initialData.prices.length
        ? initialData.prices.map((p) => ({
            id: p.id,
            categoryId: p.categoryId,
            deadlineId: p.deadlineId,
            price: p.price || 0,
          }))
        : [],
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof PricesFormSchema>) => {
    if (initialData.status === ContentStatus.PUBLISHED) {
      try {
        await axios.post(`${apiUrl}/versions`, values);
        toast.success(`Item updated`);
      } catch {
        toast.error("Something went wrong");
      } finally {
        router.refresh();
      }

      return;
    }

    try {
      await axios.patch(`${apiUrl}/versions/${initialData.id}/prices`, values);
      toast.success(`Item updated`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  const requiredFields = [initialData.name];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${totalFields})`;
  const isComplete = requiredFields.every(Boolean);

  if (!initialData || !initialData.id) {
    return redirect("/admin/contests");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="px-6 max-w-5xl mx-auto h-full">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-medium">Contest setup</h1>
            <div className="flex items-center gap-x-2">
              <Button>Save</Button>
            </div>
          </div>
          <div className=" grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 pt-6 h-full">
            <div className="col-span-full md:col-span-4 lg:col-span-8">
              <div className="flex flex-col gap-y-4">
                <ContestPricesForm
                  control={form.control}
                  initialData={initialData}
                  isSubmitting={isSubmitting}
                  reset={form.reset}
                />
              </div>
            </div>
            <div className="col-span-full md:col-span-2 lg:col-span-4 flex flex-col gap-y-4">
              <StatusView
                disabled={!isComplete || isSubmitting}
                contentType={`${SeoContentTypeApi.Contest}`}
                contentRootId={initialData.rootId!}
                contentId={initialData.id}
                status={initialData.status}
                lastSavedAt={initialData.updatedAt!}
              />
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
};
