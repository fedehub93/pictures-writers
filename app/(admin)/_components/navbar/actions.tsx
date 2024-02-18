import { UserRole } from "@prisma/client";

import { currentUser } from "@/lib/current-user";
import { UserButton, redirectToSignIn } from "@clerk/nextjs";

export const Actions = async () => {
  const user = await currentUser();

  const isUser = user?.role === UserRole.USER;

  if (!user || isUser) {
    return redirectToSignIn();
  }

  return (
    <div className="flex items-center justify-end gap-x-2 ml-4 lg:ml-0">
      <UserButton afterSignOutUrl="/" />
    </div>
  );
};
