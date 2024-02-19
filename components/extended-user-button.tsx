import { SignOutButton } from "@clerk/nextjs";
import { LogOut, Settings } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { UserAvatar } from "@/components/user-avatar";

interface UserAvatarProps {
  email: string;
  imageUrl: string;
}

export const ExtendedUserButton = ({ email, imageUrl }: UserAvatarProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <UserAvatar email={email} imageUrl={imageUrl} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>My account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <div className="flex items-center gap-x-2">
            <UserAvatar email={email} imageUrl={imageUrl} />
            <span className="text-xs text-zinc-700">{email}</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut className="mr-2 h-4 w-4" />
          <SignOutButton>Log out</SignOutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
