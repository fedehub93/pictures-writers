"use client";
import { User } from "@prisma/client";

import { ExtendedUserButton } from "@/components/extended-user-button";
import { ModeToggle } from "@/components/mode-toggle";
import { Notifications } from "./notifications";

export const Actions = ({ user }: { user: User }) => {
  return (
    <div className="flex items-center justify-end gap-x-2 ml-4 lg:ml-0">
      <ModeToggle />
      <Notifications userId={user.id} />
      <ExtendedUserButton email={user.email!} imageUrl={user.imageUrl!} />
    </div>
  );
};
