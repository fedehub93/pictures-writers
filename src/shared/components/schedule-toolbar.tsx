"use client";

import { StatusFilter } from "@/modules/blog/posts/ui/admin/components/posts-status-filter";

interface ScheduleToolbarProps {
  viewType?: "calendar" | "list";
  selectedStatus: string;
  setSelectedStatus: (status: string | any) => void;
}

const statusOptions = [
  { id: "all", label: "All Posts" },
  { id: "draft", label: "Drafts" },
  { id: "scheduled", label: "Scheduled" },
  { id: "published", label: "Published" },
];

export const ScheduleToolbar = ({
  viewType = "calendar",
  selectedStatus,
  setSelectedStatus,
}: ScheduleToolbarProps) => {
  return (
    <div className="flex items-center gap-2">
      {/* Status Filter */}
      {viewType === "calendar" && <StatusFilter />}
    </div>
  );
};
