"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";

import { ContentStatus } from "@/generated/prisma";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { PuckEditor } from "@/puck/config";

import { useSuspensePage } from "../../hooks/use-pages";
import { PageUpdateContentValues } from "../../schemas";
import { usePagesFilters } from "../../hooks/use-pages-filters";

interface PageBuilderViewProps {
  rootId: string;
}

export const PageBuilderView = ({ rootId }: PageBuilderViewProps) => {
  const { data } = useSuspensePage(rootId);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters, setFilters] = usePagesFilters();

  const updateContent = useMutation(
    trpc.pages.updateContent.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pages.getMany.queryOptions(filters),
        );
        if (data.rootId) {
          await queryClient.invalidateQueries(
            trpc.pages.getLastByRootId.queryOptions({ rootId }),
          );
        }
        toast.success("Page updated successfully!");
        // onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const createNewVersion = useMutation(
    trpc.pages.createNewVersion.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pages.getMany.queryOptions(filters),
        );

        if (data.rootId) {
          await queryClient.invalidateQueries(
            trpc.pages.getLastByRootId.queryOptions({ rootId }),
          );
        }
        toast.success("New page version created successfully!");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onSave = async (values: PageUpdateContentValues) => {
    if (data.status === ContentStatus.PUBLISHED) {
      return createNewVersion.mutate(values);
    }

    return updateContent.mutate(values);
  };

  const publishPage = useMutation(
    trpc.pages.publish.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(trpc.pages.getMany.queryFilter(filters));
        if (rootId) {
          queryClient.invalidateQueries(
            trpc.pages.getLastByRootId.queryFilter({ rootId }),
          );
        }
        toast.success("Page published successfully");
      },
      onError: async (error: any) => {
        toast.error(
          error?.response?.data?.message || "Failed to publish the page",
        );
      },
    }),
  );

  const unPublishPage = useMutation(
    trpc.pages.unpublish.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(trpc.pages.getMany.queryFilter(filters));
        if (rootId) {
          queryClient.invalidateQueries(
            trpc.pages.getLastByRootId.queryFilter({ rootId }),
          );
        }
        toast.success("Page unpublished successfully");
      },
      onError: async (error: any) => {
        toast.error(
          error?.response?.data?.message || "Failed to unpublish the page",
        );
      },
    }),
  );

  const onTogglePublish = () => {
    const mustPublish = data.status !== ContentStatus.PUBLISHED;
    if (mustPublish) {
      return publishPage.mutate({ id: data.id, rootId });
    }
    return unPublishPage.mutate({ id: data.id });
  };

  const isSaving = updateContent.isPending || createNewVersion.isPending;
  const isPublishing = publishPage.isPending || unPublishPage.isPending;

  return (
    <div>
      <PuckEditor
        id={data.id}
        rootId={rootId}
        initialData={{
          title: data.title,
          slug: data.slug,
          status: data.status,
          puckData: data.puckData ?? { root: {}, content: [] },
        }}
        isSaving={isSaving}
        isPublishing={isPublishing}
        onSavePage={onSave}
        onPublish={onTogglePublish}
      />
    </div>
  );
};

export const PageBuilderViewLoading = () => {
  return (
    <LoadingState
      title="Loading Page"
      description="This may take a few seconds"
    />
  );
};

export const PageBuilderViewError = () => {
  return <ErrorState title="Error Page" description="Something went wrong" />;
};
