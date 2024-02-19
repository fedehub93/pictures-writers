import { UserRole } from "@prisma/client";
import { redirectToSignIn } from "@clerk/nextjs";

import { getSelf } from "@/lib/current-user";
import { ExtendedUserButton } from "@/components/extended-user-button";
import { ModeToggle } from "@/components/mode-toggle";

export const Actions = async () => {
  const user = await getSelf();

  const isUser = user?.role === UserRole.USER;

  if (!user || isUser) {
    return redirectToSignIn();
  }

  return (
    <div className="flex items-center justify-end gap-x-2 ml-4 lg:ml-0">
      <ModeToggle />
      <ExtendedUserButton email={user.email} imageUrl={user.imageUrl} />
    </div>
  );
};
