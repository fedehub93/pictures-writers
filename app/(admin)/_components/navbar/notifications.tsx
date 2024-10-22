"use client";

import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { Bell, Loader2, Mail } from "lucide-react";
import { Notification } from "@prisma/client";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useNotificationsQuery } from "../../_hooks/use-notifications-query";

export const Notifications = ({ userId }: { userId: string }) => {
  const [isLoading, setIsLoading] = useState<string | null>();
  const router = useRouter();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useNotificationsQuery(userId);

  const totalNotifications: number =
    data?.pages?.[0].pagination?.totalRecords || 0;

  const onNotificatonReadClick = async (id: string) => {
    try {
      setIsLoading(id);

      await axios.patch(`/api/users/${userId}/notifications/${id}`, {
        isRead: true,
      });
      toast.success("Notification Read");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(null);
      router.refresh();
    }
  };

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
      <PopoverTrigger className="relative" asChild>
        <Button variant="ghost" size="icon">
          <Bell className="h-6 w-6" strokeWidth={1.5} />
          {totalNotifications > 0 && (
            <span className="absolute rounded-full bg-indigo-500 text-white text-xs w-5 h-5 -top-1 -right-1  flex items-center justify-center ">
              {totalNotifications}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="border border-gray-300 shadow-lg p-0 py-0.5 bg-white dark:bg-background rounded-md w-full"
      >
        {totalNotifications <= 0 && (
          <div className="px-3 py-2">Nessuna notifica</div>
        )}
        {totalNotifications > 0 && (
          <>
            <div className="px-3 py-2 font-semibold">Notifiche</div>
            <Separator />
            <div className="px-3 py-2">
              {data?.pages?.map((group, i) => {
                return group.items.map((item: Notification) => (
                  <div key={item.id} className="flex gap-x-4 items-center">
                    <div className="text-sm">{item.message}</div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onNotificatonReadClick(item.id)}
                    >
                      {isLoading && isLoading === item.id && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {!isLoading && <Mail className="h-4 w-4" />}
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
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};
