"use client";
import { User } from "@/prisma/generated/client";

import axios from "axios";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";

import { ExtendedUserButton } from "@/components/extended-user-button";
import { ModeToggle } from "@/components/mode-toggle";

import { Notifications } from "./notifications";

export const Actions = ({ user }: { user: User }) => {
  const onBuildSite = async () => {
    try {
      await axios.post(`/api/admin/build`);
      toast.success(`Site on building`);
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="flex items-center justify-end gap-x-2 ml-4 lg:ml-0">
      <Button type="button" onClick={onBuildSite}>
        Build Website
      </Button>
      <ModeToggle />
      <Notifications userId={user.id} />
      <ExtendedUserButton email={user.email!} imageUrl={user.imageUrl!} />
    </div>
  );
};
