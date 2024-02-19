import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";

interface UserAvatarProps {
  email: string;
  imageUrl: string;
}

export const UserAvatar = ({ email, imageUrl }: UserAvatarProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="relative">
          <Avatar className="h-8 w-8">
            <AvatarImage src={imageUrl} />
            {email && (
              <AvatarFallback>
                {email[0]}
                {email[1]}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="space-y-2">
        <DropdownMenuItem>
          <div className="flex items-center gap-x-2">
            <Avatar>
              <AvatarImage src={imageUrl} />
              {email && (
                <AvatarFallback>
                  {email[0]}
                  {email[1]}
                </AvatarFallback>
              )}
            </Avatar>
            <p>{email}</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <div className="h-10 w-10 mr-2 flex items-center justify-center">
            <LogOut className="h-4 w-4" />
          </div>
          <SignOutButton>Logout</SignOutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
