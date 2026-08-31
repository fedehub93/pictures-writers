"use client";

import { useCallback, useEffect, useState } from "react";
import type { Editor as TiptapEditor } from "@tiptap/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import Link from "next/link";
import { Route } from "next";

import { ContentStatus, EditorType } from "@/generated/prisma";

import { cn } from "@/shared/lib/utils";

import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { EditableField } from "@/modules/blog/shared/components/editable-field";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

import { useSuspensePost } from "../../../hooks/use-posts";
import { usePostsFilters } from "../../../hooks/use-posts-filters";
import { usePostStore } from "../../../store/use-post-store";

import { PostDetailsForm } from "../components/post-details-form";
import { SeoForm } from "../components/seo-form";
import { AuthorsForm } from "../components/authors-form";
import { PostStatusIndicator } from "../components/post-status-indicator";
import { CategoriesForm } from "../components/categories-form";
import { TagsForm } from "../components/tags-form";
import { ImageForm } from "../components/image-form";
import { DescriptionForm } from "../components/description-form";
import { PostOutline } from "../components/post-outline";

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
  const [activeTab, setActiveTab] = useState("post");
  const [tiptapEditor, setTiptapEditor] = useState<TiptapEditor | null>(null);

  const handleEditorReady = useCallback((editor: TiptapEditor | null) => {
    setTiptapEditor(editor);
  }, []);

  useEffect(() => {
    if (post.editorType !== EditorType.TIPTAP) {
      setTiptapEditor(null);
    }
  }, [post.editorType]);

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
        setStatus("saved");
        toast.success("Post updated successfully!");
      },
      onError: (error) => {
        setStatus("error");
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

  const previewLink = `${process.env.NEXT_PUBLIC_APP_URL}/draft/${post.slug}`;

  return (
    // 1. Il contenitore principale occupa l'altezza disponibile dell'area lavoro ed evita lo scroll globale della finestra
    <div className="flex flex-col h-auto xl:h-[calc(100vh-64px)] xl:overflow-hidden bg-background">
      {/* 2. Topbar Fissa in alto con z-index elevato e border-b */}
      <div className="shrink-0 flex flex-col lg:flex-row gap-4 items-center justify-between border-b px-8 py-1 bg-background z-20">
        <div className="flex-1 flex flex-col max-w-3xl">
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
          <div className="flex items-center gap-x-1">
            <Link
              href={previewLink as Route}
              target="_blank"
              className="text-xs"
            >
              {process.env.NEXT_PUBLIC_APP_URL}/
            </Link>
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
            />
          </div>
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

      <div className="flex-1 flex flex-col min-h-0 w-full">
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-24 gap-8 xl:gap-4 pt-6 xl:overflow-hidden">
          <div className="mt-0 hidden min-h-0 outline-none xl:col-span-5 xl:flex xl:flex-col pl-4 h-full">
            <PostOutline editor={tiptapEditor} />
          </div>

          <ScrollArea
            className={cn(
              "min-w-0 h-[90vh] min-h-112.5 rounded-xl px-4 xl:h-full",
              activeTab === "post" && post.editorType !== EditorType.TIPTAP
                ? "xl:col-span-17"
                : "xl:col-span-12",
            )}
          >
            <div className="mt-0 outline-none max-w-4xl mx-auto pb-12">
              <PostDetailsForm
                id={post.id}
                rootId={rootId}
                initialData={post}
                onEditorReady={handleEditorReady}
              />
            </div>
          </ScrollArea>

          <ScrollArea className="xl:col-span-7 shrink-0 h-auto rounded-xl px-4 xl:h-full">
            <div className="space-y-4 pb-12">
              <DescriptionForm
                postId={post.id}
                rootId={rootId}
                initialData={post}
              />
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

              <SeoForm id={post.id} rootId={rootId} initialData={post.seo} />
            </div>
          </ScrollArea>
        </div>
      </div>
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
