import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface UserAvatarProps {
  email: string;
  imageUrl: string;
}

export const UserAvatar = ({ email, imageUrl }: UserAvatarProps) => {
  return (
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
  );
};
