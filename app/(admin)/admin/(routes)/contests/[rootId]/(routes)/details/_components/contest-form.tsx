"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { redirect, useRouter } from "next/navigation";
import { ContentStatus, Contest, Language, Media } from "@prisma/client";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { StatusView } from "@/app/(admin)/_components/content/status-view";
import { SeoContentTypeApi } from "@/app/(admin)/_components/seo/types";
import { ContestDetailsForm } from "./contest-details-form";

interface ContestFormProps {
  initialData: Contest & {
    imageCover: Media | null;
    translation: {
      languageId: string;
      name: string | null;
      slug: string;
      shortDescription: string | null;
    } | null;
    translations: {
      languageId: string;
      name: string | null;
      slug: string;
      shortDescription: string | null;
    }[];
  };
  langId: string;
  languages: Language[];
  apiUrl: string;
}

export const contestFormSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required!",
  }),
  shortDescription: z.string().min(1, {
    message: "Short description is required!",
  }),
  slug: z.string().min(1, {
    message: "Slug is required!",
  }),
  organizationId: z.string().min(1, {
    message: "Organization is required!",
  }),
  isOpen: z.boolean(),
  imageCoverId: z.string().optional(),
  translation: z
    .object({
      languageId: z.string(),
      name: z.string().nullable().optional(),
      slug: z.string().optional(),
      shortDescription: z.string().nullable().optional(),
    })
    .nullable(),
});

export const ContestForm = ({
  initialData,
  langId,
  languages,
  apiUrl,
}: ContestFormProps) => {
  const router = useRouter();

  const isDefaultLang = !!languages.find((l) => l.id === langId)?.isDefault;

  const form = useForm<z.infer<typeof contestFormSchema>>({
    mode: "all",
    resolver: zodResolver(contestFormSchema),
    defaultValues: {
      ...initialData,
      shortDescription: initialData.shortDescription || "",
      imageCoverId: initialData.imageCoverId || undefined,
      translation: initialData.translation
        ? {
            languageId: initialData.translation.languageId,
            name: initialData.translation.name,
            slug: initialData.translation.slug,
            shortDescription: initialData.translation.shortDescription,
          }
        : null,
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof contestFormSchema>) => {
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

  useEffect(() => {
    form.reset({
      ...initialData,
      shortDescription: initialData.shortDescription || "",
      imageCoverId: initialData.imageCoverId || undefined,
      translation: initialData.translation
        ? {
            languageId: initialData.translation.languageId,
            name: initialData.translation.name,
            slug: initialData.translation.slug,
            shortDescription: initialData.translation.shortDescription,
          }
        : null,
    });
  }, [initialData, form, form.reset]);

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
                <ContestDetailsForm
                  control={form.control}
                  initialData={initialData}
                  isSubmitting={isSubmitting}
                  isDefaultLang={isDefaultLang}
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
