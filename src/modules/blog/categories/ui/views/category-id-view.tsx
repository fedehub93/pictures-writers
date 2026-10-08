"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

import { CategoryDetailsForm } from "../components/category-details-form";
import { useSuspenseCategory } from "../../hooks/use-categories";
import { useCategoriesFilters } from "../../hooks/use-categories-filters";

import { SeoForm } from "../components/seo-form";

interface CategoryIdViewProps {
  id: string;
}

export const CategoryIdView = ({ id }: CategoryIdViewProps) => {
  const { data: category } = useSuspenseCategory(id);
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters] = useCategoriesFilters();

  const removeCategory = useMutation(
    trpc.categories.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.categories.getMany.queryFilter(filters),
        );
        toast.success("Category deleted successfully!");
        router.push("/admin/categories");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onDelete = () => {
    removeCategory.mutate({ id: category.id });
  };

  const requiredFields = [category.title, category.slug];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${totalFields})`;

  return (
    <div className="size-full mx-auto p-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-medium tracking-tight">Category setup</h1>
        <div className="flex items-center gap-x-4">
          <span className="text-sm font-medium">
            Complete all fields {completionText}
          </span>
          <ConfirmModal onConfirm={onDelete}>
            <Button
              size="sm"
              variant="destructive"
              disabled={removeCategory.isPending}
            >
              <Trash2Icon className="h-4 w-4" />
            </Button>
          </ConfirmModal>
        </div>
      </div>

      <Tabs defaultValue="category" className="w-full">
        <div className="grid grid-cols-1 xl:grid-cols-24 gap-6 xl:gap-8 pt-8">
          <div className="xl:col-span-3">
            <TabsList className="flex flex-row xl:flex-col h-auto w-full justify-start bg-transparent p-0">
              <TabsTrigger
                value="category"
                className="w-full justify-start rounded-none border-b-2 xl:border-b-0 xl:border-l-2 border-border px-4 py-2.5 transition-colors hover:text-secondary-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                Category
              </TabsTrigger>
              <TabsTrigger
                value="seo"
                className="w-full justify-start rounded-none border-b-2 xl:border-b-0 xl:border-l-2 border-border px-4 py-2.5 transition-colors hover:text-secondary-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                SEO
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="xl:col-span-21 min-w-0">
            <TabsContent value="category" className="mt-0 outline-none">
              <Card className="md:p-6 shadow-sm border rounded-xl">
                <CardHeader className="px-4 pt-4 md:px-6 md:pt-2">
                  <CardTitle className="text-xl font-normal text-foreground">
                    Category
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6">
                  <CategoryDetailsForm id={category.id} initialData={category} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="mt-0 outline-none">
              <Card className="md:p-6 shadow-sm border rounded-xl">
                <CardHeader className="px-4 pt-4 md:px-6 md:pt-2">
                  <CardTitle className="text-xl font-normal text-foreground">
                    SEO
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6">
                  <SeoForm id={category.id} initialData={category.seo} />
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
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
