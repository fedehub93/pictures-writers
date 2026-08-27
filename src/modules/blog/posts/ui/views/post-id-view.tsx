"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";

import { ContentStatus } from "@/generated/prisma";

import { Button } from "@/shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { ScrollArea } from "@/shared/ui/scroll-area";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { EditableField } from "@/modules/blog/shared/components/editable-field";
import { EditableTextareaField } from "@/modules/blog/shared/components/editable-textarea-field";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

import { useSuspensePost } from "../../hooks/use-posts";
import { usePostsFilters } from "../../hooks/use-posts-filters";
import { usePostStore } from "../../store/use-post-store";

import { PostDetailsForm } from "../components/post-details-form";
import { SeoForm } from "../components/seo-form";
import { AuthorsForm } from "../components/authors-form";
import { PostStatusIndicator } from "../components/post-status-indicator";
import { CategoriesForm } from "../components/categories-form";
import { TagsForm } from "../components/tags-form";
import { ImageForm } from "../components/image-form";

interface PostIdViewProps {
  rootId: string;
}

export const PostIdView = ({ rootId }: PostIdViewProps) => {
  const { data: post } = useSuspensePost(rootId);
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters, _] = usePostsFilters();
  const { setStatus } = usePostStore();

  const publishPost = useMutation(
    trpc.posts.publish.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.posts.getMany.queryFilter(filters));
        if (rootId) {
          queryClient.invalidateQueries(
            trpc.posts.getLastByRootId.queryFilter({ rootId }),
          );
        }
        toast.success("Post published successfully");
      },
      onError: async (error) => {
        toast.error(error.message || "Failed to publish the Post");
      },
    }),
  );

  const unpublishPost = useMutation(
    trpc.posts.unpublish.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.posts.getMany.queryFilter(filters));
        if (rootId) {
          queryClient.invalidateQueries(
            trpc.posts.getLastByRootId.queryFilter({ rootId }),
          );
        }
        toast.success("Post unpublished successfully");
      },
      onError: async (error) => {
        toast.error(error.message || "Failed to unpublish the Post");
      },
    }),
  );

  const onTogglePublish = async () => {
    setStatus("publishing");
    const mustPublish = post.status !== ContentStatus.PUBLISHED;
    if (mustPublish) {
      await publishPost.mutateAsync({ id: post.id, rootId });
    } else {
      await unpublishPost.mutateAsync({ id: post.id });
    }
    setStatus("published");
  };

  const updatePost = useMutation(
    trpc.posts.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.posts.getMany.queryFilter(filters));
        if (rootId) {
          queryClient.invalidateQueries(
            trpc.posts.getLastByRootId.queryFilter({ rootId }),
          );
        }
        toast.success("Post updated successfully!");
      },
      onError: (error) => {
        toast.error(error.message || "Impossibile aggiornare");
      },
    }),
  );

  const removePost = useMutation(
    trpc.posts.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.posts.getMany.queryOptions(filters));
        toast.success("Post deleted successfully!");
        router.push("/admin/posts");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onDelete = async () => {
    removePost.mutate({ id: post.id });
  };
  const requiredFields = [post.title, post.slug];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${totalFields})`;
  const isComplete = requiredFields.every(Boolean);

  const disabled =
    publishPost.isPending || unpublishPost.isPending || updatePost.isPending;

  return (
    // 1. Il contenitore principale occupa l'altezza disponibile dell'area lavoro ed evita lo scroll globale della finestra
    <div className="flex flex-col h-auto xl:h-[calc(100vh-64px)] xl:overflow-hidden bg-background">
      {/* 2. Topbar Fissa in alto con z-index elevato e border-b */}
      <div className="shrink-0 flex flex-col lg:flex-row gap-4 items-center justify-between border-b px-8 py-1 bg-background z-20">
        <div className="flex-1 flex flex-col max-w-2xl">
          <EditableField
            initialValue={post.title}
            onSave={async (value) => {
              setStatus("saving");
              await updatePost.mutateAsync({
                id: post.id,
                rootId,
                title: value,
              });
              setStatus("saved");
            }}
            textClassName="!text-xl font-medium"
            placeholder="Post title..."
            required
            disabled={disabled}
          />
          <div className="flex items-center gap-x-1 -ml-1">
            <span className="text-xs">{process.env.NEXT_PUBLIC_APP_URL}/</span>
            <EditableField
              initialValue={post.slug}
              onSave={async (value) => {
                setStatus("saving");
                await updatePost.mutateAsync({
                  id: post.id,
                  rootId,
                  slug: value,
                });
                setStatus("saved");
              }}
              textClassName="!text-xs font-medium"
              placeholder="Post slug..."
              required
              disabled={disabled}
            />
          </div>

          <EditableTextareaField
            initialValue={post.description ?? ""}
            onSave={async (value) => {
              setStatus("saving");
              await updatePost.mutateAsync({
                id: post.id,
                rootId,
                description: value,
              });
              setStatus("saved");
            }}
            textClassName="!text-xs text-muted-foreground"
            placeholder="Post description..."
            required
            disabled={disabled}
          />
        </div>

        <div className="flex justify-between gap-x-4 shrink-0">
          <PostStatusIndicator />
          <Button
            disabled={
              disabled ||
              (post.status !== ContentStatus.PUBLISHED && !isComplete)
            }
            type="button"
            role="button"
            size="sm"
            onClick={onTogglePublish}
          >
            {post.status === ContentStatus.PUBLISHED ? "Unpublish" : "Publish"}
          </Button>
          <ConfirmModal onConfirm={onDelete}>
            <Button size="sm" variant="destructive" disabled={disabled}>
              <Trash2Icon className="size-4" />
            </Button>
          </ConfirmModal>
        </div>
      </div>

      {/* 3. Area Contenuto: occupa lo spazio rimanente */}
      <Tabs defaultValue="post" className="flex-1 flex flex-col min-h-0 w-full">
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-24 gap-8 xl:gap-8 pt-6 xl:overflow-hidden">
          {/* Sidebar Sinistra (Tabs Trigger) - Stabile in alto */}
          <div className="xl:col-span-4 shrink-0">
            <TabsList className="flex flex-row xl:flex-col h-auto w-full justify-start bg-transparent p-0">
              <TabsTrigger
                value="post"
                className="w-full justify-start rounded-none border-b-2 xl:border-b-0 xl:border-l-2 border-border px-4 py-2.5 transition-colors hover:text-secondary-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                Post
              </TabsTrigger>
              <TabsTrigger
                value="seo"
                className="w-full justify-start rounded-none border-b-2 xl:border-b-0 xl:border-l-2 border-border px-4 py-2.5 transition-colors hover:text-secondary-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                SEO
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Colonna Centrale (Editor) - UNICA AD AVERE LO SCROLL (`overflow-y-auto`) */}
          <ScrollArea className="xl:col-span-13 min-w-0 h-[90vh] min-h-112.5 xl:h-full rounded-xl px-4">
            <TabsContent
              value="post"
              className="mt-0 outline-none max-w-4xl mx-auto pb-12"
            >
              <PostDetailsForm
                id={post.id}
                rootId={rootId}
                initialData={post}
              />
            </TabsContent>

            <TabsContent value="seo" className="mt-0 outline-none pb-12">
              <SeoForm
                id={post.id}
                rootId={post.rootId!}
                initialData={post.seo}
              />
            </TabsContent>
          </ScrollArea>

          {/* Sidebar Destra (Metadati e Form aggiuntivi) - Stabile o scrollabile autonomamente */}
          <ScrollArea className="xl:col-span-7 shrink-0 h-auto xl:h-full xl:overflow-y-auto px-4 rounded-xl">
            <div className="space-y-4 pb-12">
              {/* <StatusBox
                status={post.status}
                lastSavedAt={post.updatedAt}
                disabled={disabled}
                canPublish={isComplete}
                onToggleStatus={onTogglePublish}
              /> */}
              <ImageForm postId={post.id} rootId={rootId} initialData={post} />
              <AuthorsForm
                postId={post.id}
                rootId={rootId}
                initialData={post}
              />
              <CategoriesForm
                postId={post.id}
                rootId={rootId}
                initialData={post}
              />
              <TagsForm postId={post.id} rootId={rootId} initialData={post} />
            </div>
          </ScrollArea>
        </div>
      </Tabs>
    </div>
  );
};

export const PostIdViewLoading = () => {
  return (
    <LoadingState
      title="Loading Post"
      description="This may take a few seconds"
    />
  );
};

export const PostIdViewError = () => {
  return <ErrorState title="Error Post" description="Something went wrong" />;
};
