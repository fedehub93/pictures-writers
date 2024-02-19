import { UserRole } from "@prisma/client";

import { UserButton, redirectToSignIn } from "@clerk/nextjs";
import { getSelf } from "@/lib/current-user";
import { UserAvatar } from "./user-avatar";

export const Actions = async () => {
  const user = await getSelf();

  const isUser = user?.role === UserRole.USER;

  if (!user || isUser) {
    return redirectToSignIn();
  }

  return (
    <div className="flex items-center justify-end gap-x-2 ml-4 lg:ml-0">
      <UserButton afterSignOutUrl="/" />
      <UserAvatar email={user.email} imageUrl={user.imageUrl} />
    </div>
  );
};
