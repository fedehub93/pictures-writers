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

import { TagDetailsForm } from "../components/tag-details-form";
import { useSuspenseTag } from "../../hooks/use-tags";
import { useTagsFilters } from "../../hooks/use-tags-filters";

import { SeoForm } from "../components/seo-form";

interface TagIdViewProps {
  id: string;
}

export const TagIdView = ({ id }: TagIdViewProps) => {
  const { data: tag } = useSuspenseTag(id);
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters] = useTagsFilters();

  const removeTag = useMutation(
    trpc.tags.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.tags.getMany.queryFilter(filters));
        toast.success("Tag deleted successfully!");
        router.push("/admin/tags");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onDelete = () => {
    removeTag.mutate({ id: tag.id });
  };

  const requiredFields = [tag.title, tag.slug];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${totalFields})`;

  return (
    <div className="size-full mx-auto p-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-medium tracking-tight">Tag setup</h1>
        <div className="flex items-center gap-x-4">
          <span className="text-sm font-medium">
            Complete all fields {completionText}
          </span>
          <ConfirmModal onConfirm={onDelete}>
            <Button
              size="sm"
              variant="destructive"
              disabled={removeTag.isPending}
            >
              <Trash2Icon className="h-4 w-4" />
            </Button>
          </ConfirmModal>
        </div>
      </div>

      <Tabs defaultValue="tag" className="w-full">
        <div className="grid grid-cols-1 xl:grid-cols-24 gap-6 xl:gap-8 pt-8">
          <div className="xl:col-span-3">
            <TabsList className="flex flex-row xl:flex-col h-auto w-full justify-start bg-transparent p-0">
              <TabsTrigger
                value="tag"
                className="w-full justify-start rounded-none border-b-2 xl:border-b-0 xl:border-l-2 border-border px-4 py-2.5 transition-colors hover:text-secondary-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                Tag
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
            <TabsContent value="tag" className="mt-0 outline-none">
              <Card className="md:p-6 shadow-sm border rounded-xl">
                <CardHeader className="px-4 pt-4 md:px-6 md:pt-2">
                  <CardTitle className="text-xl font-normal text-foreground">
                    Tag
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6">
                  <TagDetailsForm id={tag.id} initialData={tag} />
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
                  <SeoForm id={tag.id} initialData={tag.seo} />
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export const TagIdViewLoading = () => {
  return (
    <LoadingState
      title="Loading Tag"
      description="This may take a few seconds"
    />
  );
};

export const TagIdViewError = () => {
  return <ErrorState title="Error Tag" description="Something went wrong" />;
};
