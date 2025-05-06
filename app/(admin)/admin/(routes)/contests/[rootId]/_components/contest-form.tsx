"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useEffect } from "react";
import toast from "react-hot-toast";
import {
  redirect,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { ContentStatus, Contest, Language, Media } from "@prisma/client";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { API_ADMIN_COMPETITIONS } from "@/constants/api";
import { StatusView } from "@/app/(admin)/_components/content/status-view";
import { SeoContentTypeApi } from "@/app/(admin)/_components/seo/types";
import { LanguageSwitcher } from "@/app/(admin)/_components/language-switcher";
import { ContestDetailsForm } from "./contest-details-form";
import { ContestCategoriesForm } from "./contest-categories-form";
import { ContestDeadlinesForm } from "./contest-deadlines-form";
import { ContestPricesForm } from "./contest-prices-form";
import { Descendant } from "slate";
import { GenericEditor } from "@/components/form-component/generic-editor";

interface ContestFormProps {
  initialData: Contest & {
    imageCover: Media | null;
    categories: {
      id: string;
      name: string;
    }[];
    deadlines: {
      id: string;
      date: Date;
      name: string;
    }[];
    prices: {
      id: string;
      categoryId: string;
      deadlineId: string;
      price: any;
    }[];
  };
  languages: Language[];
  apiUrl: string;
}

export const contestFormSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required!",
  }),
  slug: z.string().min(1, {
    message: "Slug is required!",
  }),
  organizationId: z.string().min(1, {
    message: "Organization is required!",
  }),
  isOpen: z.boolean(),
  imageCoverId: z.string().optional(),
  description: z.custom<Descendant[]>(),
  benefits: z.custom<Descendant[]>(),
  rules: z.custom<Descendant[]>(),
  categories: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string(),
    })
  ),
  deadlines: z.array(
    z.object({
      id: z.string().optional(),
      date: z.date(),
      name: z.string(),
    })
  ),
  prices: z.array(
    z.object({
      id: z.string().optional(),
      categoryId: z.string(),
      deadlineId: z.string(),
      price: z.coerce.number(),
    })
  ),
});

export const ContestForm = ({
  initialData,
  languages,
  apiUrl,
}: ContestFormProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const form = useForm<z.infer<typeof contestFormSchema>>({
    mode: "all",
    resolver: zodResolver(contestFormSchema),
    defaultValues: {
      ...initialData,
      imageCoverId: initialData.imageCoverId || undefined,
      description: initialData.description || [
        { type: "paragraph", children: [{ text: "" }] },
      ],
      benefits: initialData.benefits || [
        { type: "paragraph", children: [{ text: "" }] },
      ],
      rules: initialData.rules || [
        { type: "paragraph", children: [{ text: "" }] },
      ],
      categories: initialData.categories.map((d) => ({
        id: d.id,
        name: d.name,
      })),
      deadlines: initialData.deadlines.map((d) => ({
        id: d.id,
        date: d.date,
        name: d.name,
      })),
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

  const onLanguageChange = async (langId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("langId", langId);

    const isDefaultLang = languages.find((l) => l.id === langId && l.isDefault);
    if (isDefaultLang) {
      return router.push(`${pathname}`);
    }

    const response = await axios.get<Contest>(
      `${API_ADMIN_COMPETITIONS}/${initialData.rootId}/check?langId=${langId}`
    );

    if (response.data) {
      if (!isDefaultLang) {
        router.push(`${pathname}?${params.toString()}`);
      }
    }

    if (!response.data) {
      const newContest = await axios.post(
        `${API_ADMIN_COMPETITIONS}/${initialData.rootId}/translations`,
        {
          contestId: initialData.id,
          langId,
        }
      );
      if (newContest.data) {
        router.push(`${pathname}?${params.toString()}`);
      }
    }
  };

  const onSubmit = async (values: z.infer<typeof contestFormSchema>) => {
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
      await axios.patch(`${apiUrl}/versions/${initialData.id}`, values);
      toast.success(`Item updated`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
      // location.reload();
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
      imageCoverId: initialData.imageCoverId || undefined,
      description: initialData.description || [
        { type: "paragraph", children: [{ text: "" }] },
      ],
      benefits: initialData.benefits || [
        { type: "paragraph", children: [{ text: "" }] },
      ],
      rules: initialData.rules || [
        { type: "paragraph", children: [{ text: "" }] },
      ],
      categories: initialData.categories.map((d) => ({
        id: d.id,
        name: d.name,
      })),
      deadlines: initialData.deadlines.map((d) => ({
        id: d.id,
        date: d.date,
        name: d.name,
      })),
      prices: initialData.prices.length
        ? initialData.prices.map((p) => ({
            id: p.id,
            categoryId: p.categoryId,
            deadlineId: p.deadlineId,
            price: p.price || 0,
          }))
        : [],
    });
  }, [initialData, form, form.reset]);

  if (!initialData || !initialData.id) {
    return redirect("/admin/contests");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-6 max-w-5xl mx-auto h-full">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-medium">
              Contest setup {initialData.id}
            </h1>
            <LanguageSwitcher
              languages={languages}
              onLanguageChange={onLanguageChange}
            />
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
                />
                <GenericEditor
                  key={`description: ${initialData.id}`}
                  id={`description: ${initialData.id}`}
                  control={form.control}
                  name="description"
                  label="About"
                />
                <GenericEditor
                  key={`benefits: ${initialData.id}`}
                  id={`benefits: ${initialData.id}`}
                  control={form.control}
                  name="benefits"
                  label="Benefits"
                />
                <GenericEditor
                  key={`rules: ${initialData.id}`}
                  id={`rules: ${initialData.id}`}
                  control={form.control}
                  name="rules"
                  label="Rules"
                />
                <ContestPricesForm
                  key={initialData.id}
                  control={form.control}
                  initialData={initialData}
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
              <ContestDeadlinesForm
                control={form.control}
                initialData={initialData}
                isSubmitting={isSubmitting}
              />
              <ContestCategoriesForm
                key={initialData.id}
                control={form.control}
                initialData={initialData}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
};
