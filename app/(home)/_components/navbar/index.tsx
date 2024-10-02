import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";

import Logo from "@/components/logo";
import { UserRole } from "@prisma/client";
import { getSelf } from "@/lib/current-user";
import { ExtendedUserButton } from "@/components/extended-user-button";
import { Nav } from "./_components/nav";
import { MobileNavbar } from "./_components/mobile-navbar";
import { Button } from "@/components/ui/button";

export const Navbar = async () => {
  const user = await getSelf();
  const isAdmin = user?.role === UserRole.ADMIN;
  const isEditor = user?.role === UserRole.EDITOR;
  // const canSeeAdmin = isAdmin || isEditor;

  return (
    <header className="fixed top-0 z-50 w-full border-b border-b-gray-200">
      <div className="block sm:hidden self-center whitespace-nowrap border-b bg-violet-100 text-center text-sm font-extrabold uppercase text-black md:text-2xl">
        Pictures Writers
      </div>
      <div className="h-[80px] inset-y-0 w-full z-50 p-4  flex items-center shadow-sm bg-white">
        <div className="w-full mx-auto flex justify-between md:max-w-screen-md lg:max-w-6xl">
          <div className="flex items-center gap-x-2">
            <Logo />
            <h1 className="text-xl uppercase font-bold hidden sm:block">
              Pictures Writers
            </h1>
          </div>
          <div className="hidden md:flex items-center">
            <Nav />
          </div>
          <div className="flex items-center gap-x-4">
            {/* {canSeeAdmin && <Link href="/admin">Admin</Link>}
          {user ? (
            <ExtendedUserButton email={user.email} imageUrl={user.imageUrl} />
            ) : (
              <SignInButton />
              )} */}
            <Button asChild className="font-bold">
              <Link href="/feedback-gratuito-sceneggiatura" prefetch={true}>
                Feedback Gratuito
              </Link>
            </Button>
            <MobileNavbar />
          </div>
        </div>
      </div>
    </header>
  );
};
