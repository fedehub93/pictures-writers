"use client";

import { ExtendedUserButton } from "@/shared/components/extended-user-button";
import { ModeToggle } from "@/shared/components/mode-toggle";

import { Notifications } from "./notifications";

export const Actions = ({
  user,
}: {
  user: {
    id: string;
    email: string;
    imageUrl: string;
  };
}) => {
  return (
    <div className="flex items-center justify-end gap-x-2 ml-4 lg:ml-0">
      <ModeToggle />
      <Notifications userId={user.id} />
      <ExtendedUserButton email={user.email!} imageUrl={user.imageUrl!} />
    </div>
  );
};
