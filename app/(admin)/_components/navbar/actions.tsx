import { UserRole } from "@prisma/client";

import { getSelf } from "@/lib/current-user";
import { ExtendedUserButton } from "@/components/extended-user-button";
import { ModeToggle } from "@/components/mode-toggle";

export const Actions = () => {
  return (
    <div className="flex items-center justify-end gap-x-2 ml-4 lg:ml-0">
      <ModeToggle />
      <ExtendedUserButton
        email={"federico.verrengia@gmail.com"}
        imageUrl={""}
      />
    </div>
  );
};
