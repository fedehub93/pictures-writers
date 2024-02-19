import { SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

import Logo from "@/components/logo";
import { UserRole } from "@prisma/client";
import { getSelf } from "@/lib/current-user";

export const Navbar = async () => {
  const user = await getSelf();

  const isAdmin = user?.role === UserRole.ADMIN;
  const isEditor = user?.role === UserRole.EDITOR;
  const canSeeAdmin = isAdmin || isEditor;

  return (
    <div className="p-4 border-b h-full flex items-center bg-white shadow-sm">
      <div className="w-full flex justify-between">
        <Logo />
        <div className="flex items-center gap-x-4">
          {canSeeAdmin && <Link href="/admin">Admin</Link>}
          {user ? <UserButton afterSignOutUrl="/" /> : <SignInButton />}
        </div>
      </div>
    </div>
  );
};
