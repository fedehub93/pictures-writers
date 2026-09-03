"use client";

import { useState } from "react";
import { useQueryState } from "nuqs";
import { useRouter } from "next/navigation";

import { usePostsQuery } from "@/modules/blog/posts/hooks/use-posts";
import { PostsGetMany } from "@/modules/blog/posts/types";
import { CreatePostDialog } from "@/modules/blog/posts/ui/admin/components/create-post-dialog";
import { useOpenPost } from "@/modules/blog/posts/hooks/use-open-post";
import { usePostsFilters } from "@/modules/blog/posts/hooks/use-posts-filters";

import { PostCalendar } from "./post-calendar";
import { ScheduleToolbar } from "./schedule-toolbar";

type ViewType = "month" | "week";

export const Calendar = () => {
  const router = useRouter();
  const [view, setView] = useQueryState("view", { defaultValue: "month" });
  const { onOpen } = useOpenPost();
  const [filters, setFilters] = usePostsFilters();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPostForEdit, setSelectedPostForEdit] = useState<
    PostsGetMany["items"][number] | null
  >(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data, isLoading } = usePostsQuery(filters);

  const posts = data?.items
    .filter(
      (post) => post.scheduledAt != null || post.publishedAt != null,
    )
    .map((post) => ({
      ...post,
      date: post.scheduledAt ?? post.publishedAt!,
    }));

  const handlePostClick = (_post: PostsGetMany["items"][number]) => {
    const post = data?.items.find((post) => post.id === _post.id);
    if (post) {
      router.push(`/admin/posts/${post.rootId}`);
    }
  };

  const handleCreatePost = (date: Date) => {
    setSelectedDate(date);
    onOpen({ scheduledAt: date });
  };

  return (
    <>
      <div className="flex flex-col overflow-hidden h-full">
        <div className="p-6 pt-4 h-full min-h-0 w-full">
          <PostCalendar
            posts={posts || []}
            isPending={isLoading}
            currentDate={currentDate}
            view={view as ViewType}
            onViewChange={setView}
            onDateChange={setCurrentDate}
            onPostClick={handlePostClick}
            onCreatePost={handleCreatePost}
            rightActions={
              <>
                <ScheduleToolbar
                  selectedStatus={filters.status ?? ""}
                  setSelectedStatus={(status) => {
                    setFilters({ status });
                  }}
                />
              </>
            }
          />
        </div>
      </div>
      <CreatePostDialog />
    </>
  );
};
