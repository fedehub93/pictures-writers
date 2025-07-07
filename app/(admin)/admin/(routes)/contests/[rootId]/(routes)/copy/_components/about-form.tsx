"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { Descendant } from "slate";
import { redirect, useRouter } from "next/navigation";
import { ContentStatus, Contest, Language } from "@prisma/client";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { API_ADMIN_COMPETITIONS } from "@/constants/api";
import { StatusView } from "@/app/(admin)/_components/content/status-view";
import { SeoContentTypeApi } from "@/app/(admin)/_components/seo/types";

import { GenericEditor } from "@/components/form-component/generic-editor";

interface AboutFormProps {
  initialData: Contest & {
    translation: {
      languageId: string;
      description: PrismaJson.BodyData | null;
      benefits: PrismaJson.BodyData | null;
      rules: PrismaJson.BodyData | null;
    } | null;
    translations: {
      languageId: string;
      description: PrismaJson.BodyData | null;
      benefits: PrismaJson.BodyData | null;
      rules: PrismaJson.BodyData | null;
    }[];
  };
  langId: string;
  languages: Language[];
  apiUrl: string;
}

export const AboutFormSchema = z.object({
  description: z.custom<Descendant[]>(),
  benefits: z.custom<Descendant[]>(),
  rules: z.custom<Descendant[]>(),
  translation: z
    .object({
      languageId: z.string(),
      description: z.custom<Descendant[]>().nullable(),
      benefits: z.custom<Descendant[]>().nullable(),
      rules: z.custom<Descendant[]>().nullable(),
    })
    .nullable(),
});

export const AboutForm = ({
  initialData,
  langId,
  languages,
  apiUrl,
}: AboutFormProps) => {
  const router = useRouter();

  const isDefaultLang = !!languages.find((l) => l.id === langId)?.isDefault;

  const form = useForm<z.infer<typeof AboutFormSchema>>({
    mode: "all",
    resolver: zodResolver(AboutFormSchema),
    defaultValues: {
      ...initialData,
      description: initialData.description || [
        { type: "paragraph", children: [{ text: "" }] },
      ],
      benefits: initialData.benefits || [
        { type: "paragraph", children: [{ text: "" }] },
      ],
      rules: initialData.rules || [
        { type: "paragraph", children: [{ text: "" }] },
      ],
      translation: initialData.translation
        ? {
            languageId: initialData.translation.languageId,
            description: initialData.translation.description,
            benefits: initialData.translation.benefits,
            rules: initialData.translation.rules,
          }
        : null,
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof AboutFormSchema>) => {
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

  const formDescription = isDefaultLang
    ? "description"
    : "translation.description";

  const formBenefits = isDefaultLang ? "benefits" : "translation.benefits";

  const formRules = isDefaultLang ? "rules" : "translation.rules";

  const requiredFields = [initialData.name];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${totalFields})`;
  const isComplete = requiredFields.every(Boolean);

  useEffect(() => {
    form.reset({
      ...initialData,
      description: initialData.description || [
        { type: "paragraph", children: [{ text: "" }] },
      ],
      benefits: initialData.benefits || [
        { type: "paragraph", children: [{ text: "" }] },
      ],
      rules: initialData.rules || [
        { type: "paragraph", children: [{ text: "" }] },
      ],
      translation: initialData.translation
        ? {
            languageId: initialData.translation.languageId,
            description: initialData.translation.description,
            benefits: initialData.translation.benefits,
            rules: initialData.translation.rules,
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
                <GenericEditor
                  key={`description: ${initialData.id}`}
                  id={`description: ${initialData.id}`}
                  control={form.control}
                  name={formDescription}
                  label="About"
                />
                <GenericEditor
                  key={`benefits: ${initialData.id}`}
                  id={`benefits: ${initialData.id}`}
                  control={form.control}
                  name={formBenefits}
                  label="Benefits"
                />

                <GenericEditor
                  key={`rules: ${initialData.id}`}
                  id={`rules: ${initialData.id}`}
                  control={form.control}
                  name={formRules}
                  label="Rules"
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
