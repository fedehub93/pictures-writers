"use client";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { SeoContentTypeApi } from "@/app/(admin)/_components/seo/types";
import { StatusView } from "@/app/(admin)/_components/content/status-view";
import { ContentIdActions } from "@/app/(admin)/_components/content/content-id-actions";

import { SeoForm } from "../components/seo-form";
import { CategoryDetailsForm } from "../components/category-details-form";
import { useSuspenseCategory } from "../../hooks/use-categories";

interface CategoryIdViewProps {
  rootId: string;
}

export const CategoryIdView = ({ rootId }: CategoryIdViewProps) => {
  const { data: category } = useSuspenseCategory(rootId);

  const requiredFields = [category.title, category.slug];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${totalFields})`;
  const isComplete = requiredFields.every(Boolean);

  return (
    <div className="p-4 w-full mx-auto h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Category setup</h1>
        <div className="flex items-center gap-x-2">
          <span className="text-sm text-slate-700">
            Complete all fields {completionText}
          </span>
          <ContentIdActions
            contentType={SeoContentTypeApi.Category}
            contentRootId={category.rootId!}
            contentId={category.id}
          />
        </div>
      </div>
      <div className=" grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 py-8">
        <div className="col-span-full md:col-span-4 lg:col-span-8 flex flex-col gap-y-4 overflow-auto">
          <Tabs defaultValue="category">
            <TabsList className="mb-4">
              <TabsTrigger value="category">Category</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>
            <TabsContent value="category">
              <CategoryDetailsForm
                id={category.id}
                rootId={category.rootId!}
                initialData={category}
              />
            </TabsContent>
            <TabsContent value="seo">
              <SeoForm
                id={category.id}
                rootId={category.rootId!}
                initialData={category.seo}
              />
            </TabsContent>
          </Tabs>
        </div>
        <div className="col-span-full md:col-span-2 lg:col-span-4">
          <StatusView
            disabled={!isComplete}
            contentType={SeoContentTypeApi.Category}
            contentRootId={category.rootId!}
            contentId={category.id}
            status={category.status}
            lastSavedAt={category.updatedAt}
          />
        </div>
      </div>
    </div>
  );
};

export const CategoryIdViewLoading = () => {
  return (
    <LoadingState
      title="Loading Category"
      description="This may take a few seconds"
    />
  );
};

export const CategoryIdViewError = () => {
  return (
    <ErrorState title="Error Category" description="Something went wrong" />
  );
};
