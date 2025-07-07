"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import toast from "react-hot-toast";
import { redirect, useRouter } from "next/navigation";
import { ContentStatus, Contest, Language } from "@prisma/client";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { StatusView } from "@/app/(admin)/_components/content/status-view";
import { SeoContentTypeApi } from "@/app/(admin)/_components/seo/types";

import { ContestStagesForm } from "./contest-stages-form";

interface StagesFormProps {
  initialData: Contest & {
    stages: {
      id: string;
      name: string;
      date: Date;
    }[];
  };
  langId: string;
  languages: Language[];
  apiUrl: string;
}

export const StagesFormSchema = z.object({
  stages: z.array(
    z.object({
      id: z.string().optional(),
      date: z.date(),
      name: z.string(),
    })
  ),
});

export const StagesForm = ({
  initialData,
  langId,
  apiUrl,
}: StagesFormProps) => {
  const router = useRouter();

  // const isDefaultLang = !!languages.find((l) => l.id === langId)?.isDefault;

  const form = useForm<z.infer<typeof StagesFormSchema>>({
    mode: "all",
    resolver: zodResolver(StagesFormSchema),
    values: {
      ...initialData,
      stages: initialData.stages
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((d) => ({
          id: d.id,
          name: d.name,
          date: new Date(d.date),
        })),
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof StagesFormSchema>) => {
    if (initialData.status === ContentStatus.PUBLISHED) {
      try {
        await axios.post(`${apiUrl}/versions?langId=${langId}`, values);
        toast.success(`Item updated`);
      } catch {
        toast.error("Something went wrong");
      } finally {
        router.refresh();
      }

      return;
    }

    try {
      await axios.patch(`${apiUrl}/versions/${initialData.id}`, values);
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
                <ContestStagesForm
                  control={form.control}
                  isSubmitting={isSubmitting}
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
