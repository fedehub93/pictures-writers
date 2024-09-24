import { Notification } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail } from "lucide-react";
import { useNotificationsQuery } from "../../_hooks/use-notifications-query";

export const Notifications = ({ userId }: { userId: string }) => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useNotificationsQuery(userId);

  if (status === "error") {
    return (
      <div className="flex h-full flex-col flex-1 justify-center items-center">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Something went wrong
        </p>
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger>
        <Bell className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={10}
        className="border border-gray-300 shadow-lg p-0 py-0.5 bg-white rounded-md w-full"
      >
        <div className="px-3 py-2 font-semibold">Notifiche</div>
        <Separator />
        <div className="px-3 py-2">
          {data?.pages?.map((group, i) => {
            return group.items.map((item: Notification) => (
              <div key={item.id} className="flex gap-x-4 items-center">
                <div className="text-sm">{item.message}</div>
                <Button variant="ghost" size="icon">
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            ));
          })}
        </div>
        <Separator />
        <div className="text-sm px-3 py-2 flex justify-center">
          <Button
            type="button"
            onClick={() => fetchNextPage()}
            variant="outline"
            size="sm"
            disabled={!hasNextPage || isFetchingNextPage}
          >
            {isFetchingNextPage
              ? "Loading more..."
              : hasNextPage
              ? "Load More"
              : "Nothing more to load"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
