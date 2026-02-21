"use client";

import { UserRole } from "@/generated/prisma";

import {
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useModal } from "@/app/(admin)/_hooks/use-modal-store";

interface ActionsProps {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  bio?: string | null;
  imageUrl?: string | null;
  role: UserRole;
}

export const Actions = ({
  id,
  firstName,
  lastName,
  bio,
  imageUrl,
  role,
}: ActionsProps) => {
  const { onOpen } = useModal();
  return (
    <DropdownMenuContent align="end">
      <DropdownMenuItem
        onClick={() =>
          onOpen("editUser", undefined, {
            user: { id, firstName, lastName, bio, imageUrl },
          })
        }
      >
        Edit
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
};
