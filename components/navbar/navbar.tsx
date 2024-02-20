import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";

import Logo from "@/components/logo";
import { UserRole } from "@prisma/client";
import { getSelf } from "@/lib/current-user";
import { ExtendedUserButton } from "@/components/extended-user-button";

export const Navbar = async () => {
  const user = await getSelf();
  const isAdmin = user?.role === UserRole.ADMIN;
  const isEditor = user?.role === UserRole.EDITOR;
  const canSeeAdmin = isAdmin || isEditor;

  return (
    <div className="p-4 border-b h-full flex items-center shadow-sm">
      <div className="w-full flex justify-between">
        <Logo />
        <div className="flex items-center gap-x-4">
          {canSeeAdmin && <Link href="/admin">Admin</Link>}
          {user ? (
            <ExtendedUserButton email={user.email} imageUrl={user.imageUrl} />
          ) : (
            <SignInButton />
          )}
        </div>
      </div>
    </div>
  );
};
